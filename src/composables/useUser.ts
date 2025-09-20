import { ref, computed, onMounted } from 'vue'
import { authService } from '@/firebase/auth'
import { membersService } from '@/firebase/members'
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