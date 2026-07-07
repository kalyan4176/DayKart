import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logoutUser } from './authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
  credentials: 'include',
});

const baseQueryWithReauth = async (args, apiInstance, extraOptions) => {
  let result = await baseQuery(args, apiInstance, extraOptions);
  
  if (result.error && result.error.status === 401) {
    const url = typeof args === 'string' ? args : args.url;
    if (url !== '/auth/refresh-token') {
      // Attempt silent re-authentication via refresh token
      const refreshResult = await baseQuery({ url: '/auth/refresh-token', method: 'POST' }, apiInstance, extraOptions);
      
      if (refreshResult.data) {
        // Save new credentials
        apiInstance.dispatch(setCredentials({
          user: refreshResult.data.data.user,
          accessToken: refreshResult.data.accessToken,
        }));
        // Retry original query
        result = await baseQuery(args, apiInstance, extraOptions);
      } else {
        // Refresh token expired or invalid, log out
        apiInstance.dispatch(logoutUser());
      }
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Product', 'Cart', 'Order', 'Coupon', 'Review', 'Support', 'Wishlist', 'SellerProfile', 'Category', 'Notifications', 'HeroSlide', 'ShippingRule', 'Wallet', 'Referral'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User', 'Cart'],
    }),
    googleLogin: builder.mutation({
      query: (googleData) => ({
        url: '/auth/google-login',
        method: 'POST',
        body: googleData,
      }),
      invalidatesTags: ['User', 'Cart'],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    verifyOtp: builder.mutation({
      query: (otpData) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: otpData,
      }),
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Cart'],
    }),
    sendChangePasswordOtp: builder.mutation({
      query: () => ({
        url: '/auth/change-password-otp',
        method: 'POST',
      }),
    }),
    changePassword: builder.mutation({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'POST',
        body: data,
      }),
    }),

    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Product'],
    }),
    getCategories: builder.query({
      query: () => '/products/categories',
      providesTags: ['Category'],
    }),
    getBrands: builder.query({
      query: () => '/products/brands',
    }),
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation({
      query: (productData) => ({
        url: '/products',
        method: 'POST',
        body: productData,
      }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => ['Product', { type: 'Product', id }],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),

    getCart: builder.query({
      query: () => '/users/cart',
      providesTags: ['Cart'],
    }),
    updateCart: builder.mutation({
      query: (cartData) => ({
        url: '/users/cart',
        method: 'POST',
        body: cartData,
      }),
      invalidatesTags: ['Cart'],
    }),
    getWishlist: builder.query({
      query: () => '/users/wishlist',
      providesTags: ['Wishlist'],
    }),
    toggleWishlist: builder.mutation({
      query: (productId) => ({
        url: '/users/wishlist',
        method: 'POST',
        body: { productId },
      }),
      invalidatesTags: ['Wishlist'],
    }),
    getProfile: builder.query({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/users/profile',
        method: 'PATCH',
        body: profileData,
      }),
      invalidatesTags: ['User'],
    }),
    deleteProfile: builder.mutation({
      query: () => ({
        url: '/users/profile',
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    addAddress: builder.mutation({
      query: (addressData) => ({
        url: '/users/address',
        method: 'POST',
        body: addressData,
      }),
      invalidatesTags: ['User'],
    }),
    removeAddress: builder.mutation({
      query: (addressId) => ({
        url: `/users/address/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    getFrequentlyBought: builder.query({
      query: (productId) => `/recommendations/frequently-bought/${productId}`,
    }),
    getSimilarProducts: builder.query({
      query: (productId) => `/recommendations/similar/${productId}`,
    }),
    getTrendingProducts: builder.query({
      query: () => '/recommendations/trending',
    }),
    getRecentlyViewed: builder.query({
      query: () => '/recommendations/recent',
    }),
    trackProductView: builder.mutation({
      query: (productId) => ({
        url: '/recommendations/recent',
        method: 'POST',
        body: { productId },
      }),
    }),

    checkout: builder.mutation({
      query: (checkoutData) => ({
        url: '/orders/checkout',
        method: 'POST',
        body: checkoutData,
      }),
      invalidatesTags: ['Cart', 'Order'],
    }),
    getMyOrders: builder.query({
      query: () => '/orders/my-orders',
      providesTags: ['Order'],
    }),
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: ['Order'],
    }),
    cancelOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Order'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status, message, paymentStatus }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status, message, paymentStatus },
      }),
      invalidatesTags: ['Order'],
    }),
    verifyDeliveryOtp: builder.mutation({
      query: ({ orderId, otp }) => ({
        url: `/orders/${orderId}/verify-delivery-otp`,
        method: 'PATCH',
        body: { otp },
      }),
      invalidatesTags: ['Order'],
    }),
    getSellerOrders: builder.query({
      query: () => '/orders/seller-orders',
      providesTags: ['Order'],
    }),
    getDeliveryOrders: builder.query({
      query: () => '/orders/delivery-orders',
      providesTags: ['Order'],
    }),
    getAdminOrders: builder.query({
      query: () => '/admin/orders',
      providesTags: ['Order'],
    }),

    validateCoupon: builder.mutation({
      query: ({ code, cartValue }) => ({
        url: '/coupons/validate',
        method: 'POST',
        body: { code, cartValue },
      }),
    }),
    getCoupons: builder.query({
      query: (params) => ({
        url: '/coupons',
        params,
      }),
      providesTags: ['Coupon'],
    }),
    createCoupon: builder.mutation({
      query: (couponData) => ({
        url: '/coupons',
        method: 'POST',
        body: couponData,
      }),
      invalidatesTags: ['Coupon'],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...couponData }) => ({
        url: `/coupons/${id}`,
        method: 'PATCH',
        body: couponData,
      }),
      invalidatesTags: ['Coupon'],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/coupons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Coupon'],
    }),

    getProductReviews: builder.query({
      query: (productId) => `/reviews/product/${productId}`,
      providesTags: ['Review'],
    }),
    createReview: builder.mutation({
      query: (reviewData) => ({
        url: '/reviews',
        method: 'POST',
        body: reviewData,
      }),
      invalidatesTags: ['Review', 'Product'],
    }),

    getAdminStats: builder.query({
      query: () => '/admin/stats',
    }),
    getAdminUsers: builder.query({
      query: (params) => ({
        url: '/admin/users',
        params,
      }),
    }),
    approveSeller: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/seller/${id}/approve`,
        method: 'PATCH',
        body: { status },
      }),
    }),
    approveProduct: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/product/${id}/approve`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Product'],
    }),
    getDeliveryApplications: builder.query({
      query: () => '/admin/delivery-applications',
      providesTags: ['User'],
    }),
    approveDeliveryPartner: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/delivery-partner/${id}/approve`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['User'],
    }),

    getSellerProfile: builder.query({
      query: () => '/users/seller-profile',
      providesTags: ['SellerProfile'],
    }),
    createSellerProfile: builder.mutation({
      query: (profileData) => ({
        url: '/users/seller-profile',
        method: 'POST',
        body: profileData,
      }),
      invalidatesTags: ['SellerProfile'],
    }),
    uploadProductImage: builder.mutation({
      query: (formData) => ({
        url: '/products/upload-image',
        method: 'POST',
        body: formData,
      }),
    }),
    createCategory: builder.mutation({
      query: (categoryData) => ({
        url: '/admin/categories',
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...categoryData }) => ({
        url: `/admin/categories/${id}`,
        method: 'PUT',
        body: categoryData,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/admin/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
    createSellerDirectly: builder.mutation({
      query: (sellerData) => ({
        url: '/admin/sellers',
        method: 'POST',
        body: sellerData,
      }),
    }),
    deleteSeller: builder.mutation({
      query: (id) => ({
        url: `/admin/sellers/${id}`,
        method: 'DELETE',
      }),
    }),
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),

    getMyTickets: builder.query({
      query: () => '/support/my-tickets',
      providesTags: ['Support'],
    }),
    createTicket: builder.mutation({
      query: (ticketData) => ({
        url: '/support',
        method: 'POST',
        body: ticketData,
      }),
      invalidatesTags: ['Support'],
    }),
    getAdminTickets: builder.query({
      query: (params) => ({
        url: '/support/admin-tickets',
        params,
      }),
      providesTags: ['Support'],
    }),
    replyTicket: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/support/${id}/reply`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Support'],
    }),
    resolveTicket: builder.mutation({
      query: (id) => ({
        url: `/support/${id}/resolve`,
        method: 'POST',
      }),
      invalidatesTags: ['Support'],
    }),

    getHeroSlides: builder.query({
      query: () => '/hero-slides',
      providesTags: ['HeroSlide'],
    }),
    createHeroSlide: builder.mutation({
      query: (slideData) => ({
        url: '/hero-slides',
        method: 'POST',
        body: slideData,
      }),
      invalidatesTags: ['HeroSlide'],
    }),
    updateHeroSlide: builder.mutation({
      query: ({ id, ...slideData }) => ({
        url: `/hero-slides/${id}`,
        method: 'PATCH',
        body: slideData,
      }),
      invalidatesTags: ['HeroSlide'],
    }),
    deleteHeroSlide: builder.mutation({
      query: (id) => ({
        url: `/hero-slides/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['HeroSlide'],
    }),
    returnOrder: builder.mutation({
      query: ({ id, ...returnData }) => ({
        url: `/orders/${id}/return`,
        method: 'POST',
        body: returnData,
      }),
      invalidatesTags: ['Order'],
    }),
    assignDeliveryPartner: builder.mutation({
      query: ({ orderId, deliveryPartnerId }) => ({
        url: `/orders/${orderId}/assign`,
        method: 'PATCH',
        body: { deliveryPartnerId },
      }),
      invalidatesTags: ['Order'],
    }),
    getShippingRules: builder.query({
      query: () => '/shipping-rules',
      providesTags: ['ShippingRule'],
    }),
    getCodCharge: builder.query({
      query: () => '/shipping-rules/cod-charge',
      providesTags: ['ShippingRule'],
    }),
    updateCodCharge: builder.mutation({
      query: (charge) => ({
        url: '/shipping-rules/cod-charge',
        method: 'POST',
        body: { charge },
      }),
      invalidatesTags: ['ShippingRule'],
    }),
    getCartLimits: builder.query({
      query: () => '/shipping-rules/cart-limits',
      providesTags: ['ShippingRule'],
    }),
    getDeliveryPartners: builder.query({
      query: () => '/users/delivery-partners',
      providesTags: ['User'],
    }),
    updateCartLimits: builder.mutation({
      query: (limits) => ({
        url: '/shipping-rules/cart-limits',
        method: 'POST',
        body: limits,
      }),
      invalidatesTags: ['ShippingRule'],
    }),
    createShippingRule: builder.mutation({
      query: (ruleData) => ({
        url: '/shipping-rules',
        method: 'POST',
        body: ruleData,
      }),
      invalidatesTags: ['ShippingRule'],
    }),
    updateShippingRule: builder.mutation({
      query: ({ id, ...ruleData }) => ({
        url: `/shipping-rules/${id}`,
        method: 'PUT',
        body: ruleData,
      }),
      invalidatesTags: ['ShippingRule'],
    }),
    deleteShippingRule: builder.mutation({
      query: (id) => ({
        url: `/shipping-rules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ShippingRule'],
    }),
    getWallet: builder.query({
      query: () => '/users/wallet',
      providesTags: ['Wallet'],
    }),
    getReferralSettings: builder.query({
      query: () => '/admin/referral-settings',
      providesTags: ['Referral'],
    }),
    updateReferralSettings: builder.mutation({
      query: (amountData) => ({
        url: '/admin/referral-settings',
        method: 'POST',
        body: amountData,
      }),
      invalidatesTags: ['Referral'],
    }),
    getAdminReferrals: builder.query({
      query: () => '/admin/referrals',
      providesTags: ['Referral'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useLogoutMutation,
  useSendChangePasswordOtpMutation,
  useChangePasswordMutation,
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useAddAddressMutation,
  useRemoveAddressMutation,
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCartQuery,
  useUpdateCartMutation,
  useGetFrequentlyBoughtQuery,
  useGetSimilarProductsQuery,
  useGetTrendingProductsQuery,
  useGetRecentlyViewedQuery,
  useTrackProductViewMutation,
  useCheckoutMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useUpdateOrderStatusMutation,
  useGetSellerOrdersQuery,
  useGetAdminOrdersQuery,
  useValidateCouponMutation,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useApproveSellerMutation,
  useApproveProductMutation,
  useGetSellerProfileQuery,
  useCreateSellerProfileMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useGetMyTicketsQuery,
  useCreateTicketMutation,
  useGetAdminTicketsQuery,
  useReplyTicketMutation,
  useResolveTicketMutation,
  useGoogleLoginMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useUploadProductImageMutation,
  useCreateSellerDirectlyMutation,
  useDeleteSellerMutation,
  useGetHeroSlidesQuery,
  useCreateHeroSlideMutation,
  useUpdateHeroSlideMutation,
  useDeleteHeroSlideMutation,
  useReturnOrderMutation,
  useGetShippingRulesQuery,
  useCreateShippingRuleMutation,
  useUpdateShippingRuleMutation,
  useDeleteShippingRuleMutation,
  useGetWalletQuery,
  useGetReferralSettingsQuery,
  useUpdateReferralSettingsMutation,
  useGetAdminReferralsQuery,
  useDeleteProfileMutation,
  useGetCodChargeQuery,
  useUpdateCodChargeMutation,
  useGetCartLimitsQuery,
  useUpdateCartLimitsMutation,
  useGetDeliveryOrdersQuery,
  useGetDeliveryPartnersQuery,
  useGetDeliveryApplicationsQuery,
  useApproveDeliveryPartnerMutation,
  useAssignDeliveryPartnerMutation,
  useVerifyDeliveryOtpMutation,
} = api;
