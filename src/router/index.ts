import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import { authService } from '@/firebase/auth';
import { membersService } from '@/firebase/members';
import { useOnboardingStore } from '@/stores/onboarding';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/accueil'
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/onboarding/welcome',
    component: () => import('@/views/onboarding/WelcomePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/onboarding/personal-info',
    component: () => import('@/views/onboarding/PersonalInfoPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/onboarding/ministries',
    component: () => import('@/views/onboarding/MinistriesPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/onboarding/availability',
    component: () => import('@/views/onboarding/AvailabilityPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/onboarding/congratulations',
    component: () => import('@/views/onboarding/CongratulationsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tabs/',
    component: TabsPage,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/tabs/accueil'
      },
      {
        path: 'accueil',
        component: () => import('@/views/AccueilPage.vue')
      },
      {
        path: 'services',
        component: () => import('@/views/ServicesPage.vue')
      },
      {
        path: 'disponibilites',
        component: () => import('@/views/DisponibilitesPage.vue')
      },
      {
        path: 'teams',
        component: () => import('@/views/TeamsPage.vue'),
        meta: { requiresAdmin: true }
      }
    ]
  },
  {
    path: '/service-detail/:id',
    component: () => import('@/views/ServiceDetailPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/service-form/:id?',
    component: () => import('@/views/ServiceFormPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-account',
    component: () => import('@/views/MyAccountPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    component: () => import('@/views/SettingsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/releases',
    component: () => import('@/views/ReleasesPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/about',
    component: () => import('@/views/AboutPage.vue')
  },
  {
    path: '/privacy',
    component: () => import('@/views/PrivacyPage.vue')
  },
  {
    path: '/terms',
    component: () => import('@/views/TermsPage.vue')
  },
  {
    path: '/team-detail/:id',
    component: () => import('@/views/TeamDetailPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/team-form/:id?',
    component: () => import('@/views/TeamFormPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/scheduling',
    component: () => import('@/views/SchedulingView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/availability-submission',
    component: () => import('@/views/AvailabilitySubmissionPage.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const isOnboardingRoute = to.path.startsWith('/onboarding/');
  
  // Wait for auth state to be initialized
  const user = await authService.waitForAuth();
  
  if (requiresAuth && !user) {
    // Redirect to login if authentication is required but user is not logged in
    next('/login');
  } else if (requiresGuest && user) {
    // Redirect to home if user is already logged in and trying to access guest-only pages
    next('/tabs/accueil');
  } else if (user) {
    // Check onboarding status for authenticated users
    try {
      const hasCompletedOnboarding = await membersService.hasCompletedOnboarding(user.uid);
      
      if (!hasCompletedOnboarding) {
        // If onboarding is not completed, continue from last completed step
        if (!isOnboardingRoute && to.path !== '/') {
          // Get the onboarding store to determine next step
          const onboardingStore = useOnboardingStore();
          const nextStep = onboardingStore.getNextIncompleteStep();
          next(nextStep);
        } else {
          next();
        }
      } else {
        // Check admin access for admin-only routes
        if (requiresAdmin) {
          const member = await membersService.getMemberByFirebaseUserId(user.uid);
          if (!member || !member.isAdmin) {
            // Redirect non-admin users to home
            next('/tabs/accueil');
            return;
          }
        }
        
        // Onboarding completed - prevent access to onboarding pages
        if (isOnboardingRoute) {
          next('/tabs/accueil');
        } else {
          next();
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      next();
    }
  } else {
    next();
  }
});

export default router
