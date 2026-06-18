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
  tagTypes: ['User', 'Product', 'Cart', 'Order', 'Coupon', 'Review', 'Support', 'Wishlist', 'SellerProfile'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
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

    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Product'],
    }),
    getCategories: builder.query({
      query: () => '/products/categories',
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
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Order'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status, message }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status, message },
      }),
      invalidatesTags: ['Order'],
    }),

    validateCoupon: builder.mutation({
      query: ({ code, cartValue }) => ({
        url: '/coupons/validate',
        method: 'POST',
        body: { code, cartValue },
      }),
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
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useLogoutMutation,
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
  useValidateCouponMutation,
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useApproveSellerMutation,
  useApproveProductMutation,
  useGetSellerProfileQuery,
  useCreateSellerProfileMutation,
  useGetMyTicketsQuery,
  useCreateTicketMutation,
} = api;
