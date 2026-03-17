import { createRouter, createWebHistory } from 'vue-router';
import UserLogin from '../views/UserLogin.vue';
import UserDashboard from '../views/UserDashboard.vue';
import UserContact from '../views/UserContact.vue';

const routes = [
    { path: '/', name: 'UserLogin', component: UserLogin },
    {
        path: '/dashboard',
        name: 'UserDashboard',
        component: UserDashboard,
        children: [
            {
                path: '/schedule',
                name: 'UserSchedule',
                component: () => import('../views/UserSchedule.vue'),
            },
            {
                path: '/contact',
                name: 'UserContact',
                component: UserContact,
            },
        ],
    },
    {
        path: '/admin',
        name: 'AdmDashboard',
        component: () => import('../views/AdmDashboard.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
       children: [
                    { path: '', redirect: { name: 'AdminAgendamentos' } },

                    {
                        path: 'agendamentos',
                        name: 'AdminAgendamentos',
                        component: () => import('../views/AdminAgendamentos.vue')
                    },

                    {
                        path: 'servicos',
                        name: 'AdminServicos',
                        component: () => import('../views/AdminServicos.vue')
                    },

                    {
                        path: 'blocked-periods',
                        name: 'AdminBlockedPeriods',
                        component: () => import('../views/AdminBlockedPeriods.vue')
                    }
                ]

    }

];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
});

router.beforeEach((to, from, next) => {
    const token = sessionStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');

    if (to.meta.requiresAuth && !token) {
        return next('/');
    }

    if (to.meta.requiresAdmin && role !== 'adm') {
        return next('/dashboard');
    }

    next();
});

export default router;
