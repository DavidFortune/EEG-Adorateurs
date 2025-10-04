import { ref, computed, onMounted } from 'vue'
import { authService } from '@/firebase/auth'
import { membersService } from '@/firebase/members'
import { teamsService } from '@/firebase/teams'
import type { Member } from '@/types/member'
import type { Team } from '@/types/team'

export function useUser() {
  const user = ref(authService.getCurrentUser())
  const member = ref<Member | null>(null)
  const memberTeams = ref<Team[]>([])

  const userAvatar = computed(() => {
    if (user.value?.photoURL) {
      return user.value.photoURL
    }
    return null
  })

  const userInitials = computed(() => {
    if (user.value?.displayName) {
      const names = user.value.displayName.split(' ')
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`
      }
      return names[0].charAt(0)
    }
    if (user.value?.email) {
      return user.value.email.charAt(0).toUpperCase()
    }
    return '?'
  })

  const userName = computed(() => {
    return user.value?.displayName || user.value?.email || 'Utilisateur'
  })

  const isAdmin = computed(() => {
    return member.value?.isAdmin || false
  })

  const isTeamLeaderOrOwner = computed(() => {
    if (!member.value) return false

    // Check if user is owner or leader in any team
    return memberTeams.value.some(team => {
      const membership = team.members.find(m => m.memberId === member.value!.id)
      if (!membership) return false

      // Only approved members with owner or leader role
      const isApproved = membership.status === 'approved' || !membership.status
      const isLeaderOrOwner = membership.role === 'owner' || membership.role === 'leader'

      return isApproved && isLeaderOrOwner
    })
  })

  const canManageServices = computed(() => {
    return isAdmin.value || isTeamLeaderOrOwner.value
  })

  const loadMemberData = async () => {
    if (user.value) {
      try {
        member.value = await membersService.getMemberByFirebaseUserId(user.value.uid)

        // Load member teams for permission checking
        if (member.value) {
          try {
            memberTeams.value = await teamsService.getMemberTeams(member.value.id)

            // If teams field is empty, populate it from team members
            if (!member.value.teams || member.value.teams.length === 0) {
              // Extract team IDs where user is approved (treat members without status as approved)
              const approvedTeamIds = memberTeams.value
                .filter(team => {
                  const membership = team.members.find(m => m.memberId === member.value!.id)
                  return membership && (membership.status === 'approved' || !membership.status)
                })
                .map(team => team.id)

              if (approvedTeamIds.length > 0) {
                // Update member's teams field with approved team IDs only
                const updatedMember = await membersService.updateMember(member.value.id, {
                  teams: approvedTeamIds
                })

                if (updatedMember) {
                  member.value = updatedMember
                }
              }
            }
          } catch (error) {
            console.error('Error populating teams from team members:', error)
          }
        }
      } catch (error) {
        console.error('Error loading member data:', error)
        member.value = null
      }
    } else {
      member.value = null
      memberTeams.value = []
    }
  }

  onMounted(() => {
    // Load initial member data
    loadMemberData()
    
    // Update user when auth state changes
    authService.onAuthStateChanged((newUser) => {
      user.value = newUser
      loadMemberData()
    })
  })

  return {
    user,
    member,
    memberTeams,
    userAvatar,
    userInitials,
    userName,
    isAdmin,
    isTeamLeaderOrOwner,
    canManageServices,
    loadMemberData
  }
}