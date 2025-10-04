import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import { authService } from '@/firebase/auth';
import { membersService } from '@/firebase/members';
import { teamsService } from '@/firebase/teams';
import { analyticsService } from '@/services/analyticsService';
import { performanceService } from '@/services/performanceService';
import { useOnboardingStore } from '@/stores/onboarding';
import type { Team } from '@/types/team';

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
    path: '/onboarding/teams',
    component: () => import('@/views/onboarding/TeamSelectionPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/onboarding/phone',
    component: () => import('@/views/onboarding/PhonePage.vue'),
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
        component: () => import('@/views/services/ServicesPage.vue')
      },
      {
        path: 'resources',
        component: () => import('@/views/resources/ResourcesPage.vue')
      },
      {
        path: 'disponibilites',
        component: () => import('@/views/DisponibilitesPage.vue')
      },
      {
        path: 'teams',
        component: () => import('@/views/teams/TeamsPage.vue')
      }
    ]
  },
  {
    path: '/service-detail/:id',
    component: () => import('@/views/services/ServiceDetailPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/service-members/:id',
    component: () => import('@/views/services/ServiceMembersPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/service-program/:id',
    component: () => import('@/views/services/ServiceProgramPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/service-form/:id?',
    component: () => import('@/views/services/ServiceFormPage.vue'),
    meta: { requiresAuth: true, requiresServiceManager: true }
  },
  {
    path: '/resource-detail/:id',
    component: () => import('@/views/resources/ResourceDetailPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/resource-form/:id?',
    component: () => import('@/views/resources/ResourceFormPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/collections',
    component: () => import('@/views/resources/ResourceCollectionsPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
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
    component: () => import('@/views/corporate/ReleasesPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/about',
    component: () => import('@/views/corporate/AboutPage.vue')
  },
  {
    path: '/privacy',
    component: () => import('@/views/corporate/PrivacyPage.vue')
  },
  {
    path: '/terms',
    component: () => import('@/views/corporate/TermsPage.vue')
  },
  {
    path: '/team-detail/:id',
    component: () => import('@/views/teams/TeamDetailPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/team-form/:id?',
    component: () => import('@/views/teams/TeamFormPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/scheduling',
    component: () => import('@/views/SchedulingView.vue'),
    meta: { requiresAuth: true, requiresServiceManager: true }
  },
  {
    path: '/team-availability/:id',
    component: () => import('@/views/teams/TeamAvailabilityPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/team-assignments/:id',
    component: () => import('@/views/teams/TeamAssignmentsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/team-scheduling/:id',
    component: () => import('@/views/teams/TeamSchedulingView.vue'),
    meta: { requiresAuth: true, requiresServiceManager: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Track page load performance
router.beforeEach((to, _from, next) => {
  // Start performance tracking for this page
  const pageName = to.name?.toString() || to.path.substring(1) || 'home';
  performanceService.startPageTrace(pageName);
  next();
});

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const requiresServiceManager = to.matched.some(record => record.meta.requiresServiceManager);
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
        const member = await membersService.getMemberByFirebaseUserId(user.uid);

        // Check admin access for admin-only routes
        if (requiresAdmin) {
          if (!member || !member.isAdmin) {
            // Redirect non-admin users to home
            next('/tabs/accueil');
            return;
          }
        }

        // Check service manager access (admin, owner, or leader)
        if (requiresServiceManager) {
          if (!member) {
            next('/tabs/accueil');
            return;
          }

          // Admin always has access
          if (member.isAdmin) {
            next();
            return;
          }

          // Check if user is owner or leader in any team
          const memberTeams: Team[] = await teamsService.getMemberTeams(member.id);
          const isTeamLeaderOrOwner = memberTeams.some((team: Team) => {
            const membership = team.members.find(m => m.memberId === member.id);
            if (!membership) return false;

            const isApproved = membership.status === 'approved' || !membership.status;
            const isLeaderOrOwner = membership.role === 'owner' || membership.role === 'leader';

            return isApproved && isLeaderOrOwner;
          });

          if (!isTeamLeaderOrOwner) {
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

// Track screen views for analytics and stop performance tracking
router.afterEach((to) => {
  try {
    // Get a readable screen name from the route
    let screenName = to.name?.toString() || to.path;

    // Clean up the screen name
    if (screenName.startsWith('/')) {
      screenName = screenName.substring(1);
    }
    if (!screenName) {
      screenName = 'home';
    }

    // Track the screen view
    analyticsService.trackScreenView(screenName, to.meta.screenClass as string);

    // Stop performance tracking after a small delay to allow component mounting
    setTimeout(() => {
      performanceService.stopPageTrace(screenName);
    }, 100);
  } catch (error) {
    console.error('Error tracking screen view:', error);
  }
});

export default router
