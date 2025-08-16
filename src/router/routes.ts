import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        path: 'profile',
        component: () => import('pages/usermenu/ProfilePage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'my-banen',
        component: () => import('pages/usermenu/MyBanenPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'spelers',
        component: () => import('pages/appmenu/SpelersOverviewPage.vue'),
        meta: { requiresAuth: true }, // Vereist authenticatie voor privacy
      },
      {
        path: 'spelers/:id',
        component: () => import('pages/appmenu/SpelerDetailPage.vue'),
        meta: { requiresAuth: true }, // Vereist authenticatie voor privacy
      },
      {
        path: 'banen',
        component: () => import('pages/appmenu/BanenOverviewPage.vue'),
        meta: { requiresAuth: false }, // Openbaar toegankelijk
      },
      {
        path: 'banen/:id',
        component: () => import('pages/appmenu/BaanDetailPage.vue'),
        meta: { requiresAuth: false }, // Openbaar toegankelijk
      },
      {
        path: 'berichten',
        component: () => import('pages/appmenu/BerichtenOverviewPage.vue'),
        meta: { requiresAuth: false }, // Openbaar toegankelijk
      },
      {
        path: 'events',
        component: () => import('pages/appmenu/EventsOverviewPage.vue'),
        meta: { requiresAuth: false }, // Openbaar toegankelijk
      },
      {
        path: 'live',
        component: () => import('pages/appmenu/LivePage.vue'),
        meta: { requiresAuth: false }, // Openbaar toegankelijk
      },
      {
        path: '/mijn-rondes',
        name: 'mijn-rondes',
        component: () => import('pages/usermenu/MyRoundsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/mijn-events',
        name: 'mijn-events',
        component: () => import('pages/usermenu/MyEventsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/events/:id',
        name: 'event-detail',
        component: () => import('pages/usermenu/EventDetailPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/events/:id/deelnemers',
        name: 'event-participants',
        component: () => import('pages/usermenu/EventParticipantsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/events/:id/edit',
        name: 'event-edit',
        component: () => import('pages/usermenu/EditEventPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/rondes/:id',
        name: 'ronde-detail',
        component: () => import('pages/usermenu/RondeDetailPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/rondes/:id/scores',
        name: 'ronde-scores',
        component: () => import('pages/usermenu/RoundScoresPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/events/form/:id',
        name: 'event-form',
        component: () => import('pages/usermenu/EventFormPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/events/create',
        name: 'create-event',
        component: () => import('pages/usermenu/CreateEventPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/events/:id/rounds',
        name: 'event-rounds',
        component: () => import('pages/usermenu/EventRoundsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/marker-scan',
        name: 'marker-scan',
        component: () => import('pages/usermenu/MarkerScanPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/mijn-statistieken',
        name: 'mijn-statistieken',
        component: () => import('pages/usermenu/MyStatsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/moderator-approval',
        name: 'moderator-approval',
        component: () => import('pages/usermenu/ModeratorApprovalPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/data-management',
        name: 'data-management',
        component: () => import('pages/usermenu/DataManagementPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/auth',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: 'login', component: () => import('pages/auth/LoginPage.vue') },
      { path: 'register', component: () => import('pages/auth/RegisterPage.vue') },
      { path: 'forgot-password', component: () => import('pages/auth/ForgotPasswordPage.vue') },
    ],
  },
  {
    path: '/test-country-select',
    component: () => import('pages/usermenu/CountrySelectTest.vue'),
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
