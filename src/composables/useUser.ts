import { ref, computed, onMounted } from 'vue'
import { authService } from '@/firebase/auth'
import { membersService } from '@/firebase/members'
import { teamsService } from '@/firebase/teams'
import type { Member } from '@/types/member'

export function useUser() {
  const user = ref(authService.getCurrentUser())
  const member = ref<Member | null>(null)

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

  const loadMemberData = async () => {
    if (user.value) {
      try {
        member.value = await membersService.getMemberByFirebaseUserId(user.value.uid)

        // If teams field is empty, populate it from team members
        if (member.value && (!member.value.teams || member.value.teams.length === 0)) {
          try {
            const memberTeams = await teamsService.getMemberTeams(member.value.id)

            // Extract team IDs where user is approved (treat members without status as approved)
            const approvedTeamIds = memberTeams
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
    userAvatar,
    userInitials,
    userName,
    isAdmin,
    loadMemberData
  }
}