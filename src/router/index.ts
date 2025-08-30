import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/accueil'
  },
  {
    path: '/tabs/',
    component: TabsPage,
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
      }
    ]
  },
  {
    path: '/service-detail/:id',
    component: () => import('@/views/ServiceDetailPage.vue')
  },
  {
    path: '/service-form/:id?',
    component: () => import('@/views/ServiceFormPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
