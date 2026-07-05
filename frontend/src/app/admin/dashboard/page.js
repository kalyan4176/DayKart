'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { LayoutDashboard, Users, ShoppingBag, ShieldCheck, CheckCircle2, XCircle, User, Mail, Phone, AlertTriangle, Store, Plus, Trash2, Edit, FolderOpen, ClipboardList, RefreshCw, ChevronRight, Sliders, Tag, Gift, Percent, Calendar, Truck, Wallet, Search, ChevronDown, MessageSquare } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useToast } from '@/components/ToastProvider';
import { updateUser } from '@/store/authSlice';
import {
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useGetProductsQuery,
  useApproveSellerMutation,
  useApproveProductMutation,
  useUpdateProfileMutation,
  useGetProfileQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateSellerDirectlyMutation,
  useDeleteSellerMutation,
  useDeleteProductMutation,
   useGetAdminOrdersQuery,
   useGetHeroSlidesQuery,
   useCreateHeroSlideMutation,
   useUpdateHeroSlideMutation,
   useDeleteHeroSlideMutation,
   useGetCouponsQuery,
   useCreateCouponMutation,
   useUpdateCouponMutation,
   useDeleteCouponMutation,
   useGetShippingRulesQuery,
   useCreateShippingRuleMutation,
   useUpdateShippingRuleMutation,
   useDeleteShippingRuleMutation,
   useGetCodChargeQuery,
   useUpdateCodChargeMutation,
   useGetCartLimitsQuery,
   useUpdateCartLimitsMutation,
   useGetWalletQuery,
   useGetReferralSettingsQuery,
   useUpdateReferralSettingsMutation,
   useGetAdminReferralsQuery,
   useGetAdminTicketsQuery,
   useReplyTicketMutation,
   useResolveTicketMutation,
   useGetDeliveryApplicationsQuery,
   useApproveDeliveryPartnerMutation,
   useAssignDeliveryPartnerMutation,
   useGetDeliveryPartnersQuery,
} from '@/store/api';

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [activeTab, setActiveTab] = useState('overview');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null); // 'sales' | 'customers' | 'rejections'
  const [metricSearchQuery, setMetricSearchQuery] = useState('');

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: () => {},
  });

  const triggerConfirmation = (config) => {
    setConfirmConfig({
      isOpen: true,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      type: config.type || 'danger',
      onConfirm: config.onConfirm,
    });
  };

  useEffect(() => {
    if (mounted && (!isAuthenticated || !user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [mounted, isAuthenticated, user, router]);

  const isAdmin = isAuthenticated && user && user.role === 'admin';

  // Queries
  const [productFilter, setProductFilter] = useState('pending'); // 'pending' or 'all'

  const { data: statsRes, isLoading: statsLoading, refetch: refetchStats } = useGetAdminStatsQuery(undefined, { skip: activeTab !== 'overview' || !isAdmin || !mounted });
  const { data: sellersRes, refetch: refetchSellers } = useGetAdminUsersQuery({ role: 'seller' }, { skip: (activeTab !== 'sellers' && activeTab !== 'approvals') || !isAdmin || !mounted });
  const { data: productsRes, refetch: refetchProducts } = useGetProductsQuery({ status: activeTab === 'approvals' ? 'pending' : productFilter, limit: 100 }, { skip: (activeTab !== 'products' && activeTab !== 'approvals') || !isAdmin || !mounted });

  // Carousel manager state and queries
  const { data: slidesRes, refetch: refetchSlides } = useGetHeroSlidesQuery(undefined, { skip: activeTab !== 'carousel' || !isAdmin || !mounted });
  const { data: approvedProductsRes } = useGetProductsQuery({ status: 'approved', limit: 100 }, { skip: activeTab !== 'carousel' || !isAdmin || !mounted });

  const [createHeroSlide] = useCreateHeroSlideMutation();
  const [updateHeroSlide] = useUpdateHeroSlideMutation();
  const [deleteHeroSlide] = useDeleteHeroSlideMutation();

  // Coupon manager state and queries
  const { data: couponsRes, refetch: refetchCoupons } = useGetCouponsQuery(undefined, { skip: activeTab !== 'coupons' || !isAdmin || !mounted });
  const [createCoupon] = useCreateCouponMutation();
  const [updateCoupon] = useUpdateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();

  // Shipping rule manager state and queries
  const { data: shippingRulesRes, refetch: refetchShippingRules } = useGetShippingRulesQuery(undefined, { skip: activeTab !== 'shipping' || !isAdmin || !mounted });
  const [createShippingRule] = useCreateShippingRuleMutation();
  const [updateShippingRule] = useUpdateShippingRuleMutation();
  const [deleteShippingRule] = useDeleteShippingRuleMutation();

  const [editingShippingRule, setEditingShippingRule] = useState(null);
  const [minCartValue, setMinCartValue] = useState(0);
  const [maxCartValue, setMaxCartValue] = useState('');
  const [noUpperLimit, setNoUpperLimit] = useState(false);
  const [shippingCharge, setShippingCharge] = useState(0);

  // COD Charge query and mutation
  const { data: codChargeRes, refetch: refetchCodCharge } = useGetCodChargeQuery(undefined, { skip: activeTab !== 'shipping' || !isAdmin || !mounted });
  const [updateCodCharge, { isLoading: isUpdatingCodCharge }] = useUpdateCodChargeMutation();
  const [codChargeInput, setCodChargeInput] = useState(0);

  useEffect(() => {
    if (codChargeRes?.data?.charge !== undefined) {
      setCodChargeInput(codChargeRes.data.charge);
    }
  }, [codChargeRes]);

  // Wallet query
  const { data: walletRes, isLoading: walletLoading, refetch: refetchWallet } = useGetWalletQuery(undefined, { skip: activeTab !== 'wallet' || !isAdmin || !mounted });
  const wallet = walletRes?.data?.wallet || { balance: 0, transactions: [] };

  // Referral query & mutations
  const { data: referralSettingsRes, refetch: refetchReferralSettings } = useGetReferralSettingsQuery(undefined, { skip: activeTab !== 'referrals' || !isAdmin || !mounted });
  const [updateReferralSettings] = useUpdateReferralSettingsMutation();
  const { data: adminReferralsRes, refetch: refetchAdminReferrals } = useGetAdminReferralsQuery(undefined, { skip: activeTab !== 'referrals' || !isAdmin || !mounted });

  const [referralRewardAmount, setReferralRewardAmount] = useState(50);
  const [updatingReward, setUpdatingReward] = useState(false);
  const [referralSearch, setReferralSearch] = useState('');
  const [referralDateFilter, setReferralDateFilter] = useState('all'); // 'all' | '7days' | '30days'
  const [referralSortOrder, setReferralSortOrder] = useState('newest'); // 'newest' | 'oldest'

  const [sellerSearchQuery, setSellerSearchQuery] = useState('');
  const [sellerStatusFilter, setSellerStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  const [productSearchQuery, setProductSearchQuery] = useState('');

  const [couponSearchQuery, setCouponSearchQuery] = useState('');
  const [couponStatusFilter, setCouponStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  const [shippingSearchQuery, setShippingSearchQuery] = useState('');

  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all' | 'placed' | 'processed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled'

  // Support Tickets State
  const [ticketStatusFilter, setTicketStatusFilter] = useState('pending'); // 'pending' | 'resolved'
  const [deliverySubTab, setDeliverySubTab] = useState('partners'); // 'partners' | 'applications' | 'shipments'
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all'); // 'all' | 'low' | 'medium' | 'high'
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  const { data: ticketsRes, refetch: refetchTickets, isLoading: ticketsLoading } = useGetAdminTicketsQuery(
    {
      status: ticketStatusFilter === 'resolved' ? 'resolved' : undefined,
      priority: ticketPriorityFilter === 'all' ? undefined : ticketPriorityFilter,
    },
    { skip: activeTab !== 'tickets' || !isAdmin || !mounted }
  );

  const [replyTicket, { isLoading: isReplying }] = useReplyTicketMutation();
  const [resolveTicket, { isLoading: isResolving }] = useResolveTicketMutation();
  const { data: profileRes, refetch: refetchProfile } = useGetProfileQuery(undefined, { skip: activeTab !== 'profile' || !isAdmin || !mounted });

  // Cart Settings State
  const [minCheckoutValInput, setMinCheckoutValInput] = useState('');
  const [minCodValInput, setMinCodValInput] = useState('');
  const [defaultAgentInput, setDefaultAgentInput] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  const { data: cartLimitsRes, refetch: refetchCartLimits } = useGetCartLimitsQuery(undefined, { skip: activeTab !== 'settings' || !isAdmin || !mounted });
  const [updateCartLimitsMutation, { isLoading: isUpdatingCartLimits }] = useUpdateCartLimitsMutation();

  const { data: deliveryApplicationsRes, refetch: refetchDeliveryApplications, isLoading: deliveryApplicationsLoading } = useGetDeliveryApplicationsQuery(undefined, { skip: activeTab !== 'delivery' || !isAdmin || !mounted });
  const [approveDeliveryPartner, { isLoading: isApprovingDelivery }] = useApproveDeliveryPartnerMutation();
  const [assignDeliveryPartner, { isLoading: isAssigningDelivery }] = useAssignDeliveryPartnerMutation();
  const { data: deliveryPartnersRes, refetch: refetchDeliveryPartners } = useGetAdminUsersQuery({ role: 'delivery_partner' }, { skip: (activeTab !== 'orders' && activeTab !== 'delivery' && activeTab !== 'settings') || !isAdmin || !mounted });

  useEffect(() => {
    if (cartLimitsRes?.data) {
      setMinCheckoutValInput(cartLimitsRes.data.minCheckoutValue !== undefined ? cartLimitsRes.data.minCheckoutValue : '');
      setMinCodValInput(cartLimitsRes.data.minCodValue !== undefined ? cartLimitsRes.data.minCodValue : '');
      setDefaultAgentInput(cartLimitsRes.data.defaultDeliveryAgent || '');
    }
  }, [cartLimitsRes]);

  const tickets = ticketsRes?.data?.tickets || [];
  const selectedTicket = tickets.find(t => t._id === selectedTicketId);
  const deliveryPartnersList = deliveryPartnersRes?.data?.users || [];

  const filteredTickets = tickets.filter(ticket => {
    if (ticketStatusFilter === 'pending' && ticket.status === 'resolved') return false;
    if (ticketStatusFilter === 'resolved' && ticket.status !== 'resolved') return false;

    const search = ticketSearchQuery.toLowerCase().trim();
    if (!search) return true;
    const subjectMatches = (ticket.subject || '').toLowerCase().includes(search);
    const emailMatches = (ticket.customer?.email || '').toLowerCase().includes(search);
    const nameMatches = (ticket.customer?.name || '').toLowerCase().includes(search);
    return subjectMatches || emailMatches || nameMatches;
  });

  const handleSendTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReplyText.trim()) return;

    try {
      await replyTicket({ id: selectedTicketId, text: ticketReplyText.trim() }).unwrap();
      setTicketReplyText('');
      showToast('Reply sent successfully.', 'success');
      refetchTickets();
    } catch (err) {
      showToast(err.data?.message || 'Failed to send reply.', 'error');
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicketId) return;
    try {
      await resolveTicket(selectedTicketId).unwrap();
      showToast('Ticket marked as resolved.', 'success');
      refetchTickets();
    } catch (err) {
      showToast(err.data?.message || 'Failed to resolve ticket.', 'error');
    }
  };

  const referrals = adminReferralsRes?.data?.referrals || [];
  const filteredReferrals = referrals
    .filter(ref => {
      const searchLower = referralSearch.toLowerCase().trim();
      let matchesSearch = true;
      if (searchLower) {
        const referredName = (ref.name || '').toLowerCase();
        const referredEmail = (ref.email || '').toLowerCase();
        const referrerName = (ref.referredBy?.name || '').toLowerCase();
        const referrerCode = (ref.referredBy?.referralCode || '').toLowerCase();
        matchesSearch = referredName.includes(searchLower) ||
                        referredEmail.includes(searchLower) ||
                        referrerName.includes(searchLower) ||
                        referrerCode.includes(searchLower);
      }

      let matchesDate = true;
      if (referralDateFilter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        matchesDate = new Date(ref.createdAt) >= sevenDaysAgo;
      } else if (referralDateFilter === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        matchesDate = new Date(ref.createdAt) >= thirtyDaysAgo;
      }

      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return referralSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  useEffect(() => {
    if (referralSettingsRes?.data?.amount !== undefined) {
      setReferralRewardAmount(referralSettingsRes.data.amount);
    }
  }, [referralSettingsRes]);

  useEffect(() => {
    if (mounted && isAdmin && activeTab === 'overview' && refetchStats) {
      try {
        refetchStats();
      } catch (err) {
        // Safe fallback for queries not initialized yet
      }
    } else if (mounted) {
      setSelectedMetric(null);
      setMetricSearchQuery('');
    }
  }, [activeTab, refetchStats, mounted, isAdmin]);

  const handleSaveReferralSettings = async (e) => {
    e.preventDefault();
    if (referralRewardAmount < 0) {
      showToast('Referral bonus amount cannot be negative.', 'error');
      return;
    }

    setUpdatingReward(true);
    try {
      await updateReferralSettings({ amount: Number(referralRewardAmount) }).unwrap();
      showToast('Referral settings updated successfully!', 'success');
      refetchReferralSettings();
    } catch (err) {
      showToast(err.data?.message || 'Failed to update referral settings.', 'error');
    } finally {
      setUpdatingReward(false);
    }
  };

  const resetShippingForm = () => {
    setEditingShippingRule(null);
    setMinCartValue(0);
    setMaxCartValue('');
    setNoUpperLimit(false);
    setShippingCharge(0);
  };

  const handleSaveShippingRule = async (e) => {
    e.preventDefault();
    if (minCartValue < 0 || shippingCharge < 0) {
      showToast('Values cannot be negative.', 'error');
      return;
    }
    const maxVal = noUpperLimit ? null : (maxCartValue === '' ? null : Number(maxCartValue));
    if (maxVal !== null && minCartValue > maxVal) {
      showToast('Min cart value cannot be greater than Max cart value.', 'error');
      return;
    }

    const ruleData = {
      minCartValue: Number(minCartValue),
      maxCartValue: maxVal,
      charge: Number(shippingCharge)
    };

    try {
      if (editingShippingRule) {
        await updateShippingRule({ id: editingShippingRule._id, ...ruleData }).unwrap();
        showToast('Shipping rule updated successfully!', 'success');
      } else {
        await createShippingRule(ruleData).unwrap();
        showToast('Shipping rule created successfully!', 'success');
      }
      resetShippingForm();
      if (refetchShippingRules) refetchShippingRules();
    } catch (err) {
      showToast(err.data?.message || 'Failed to save shipping rule.', 'error');
    }
  };

  const handleEditShippingRule = (rule) => {
    setEditingShippingRule(rule);
    setMinCartValue(rule.minCartValue);
    if (rule.maxCartValue === null || rule.maxCartValue === undefined) {
      setMaxCartValue('');
      setNoUpperLimit(true);
    } else {
      setMaxCartValue(rule.maxCartValue);
      setNoUpperLimit(false);
    }
    setShippingCharge(rule.charge);
  };

  const handleDeleteShippingRule = async (id) => {
    triggerConfirmation({
      title: 'Delete Shipping Rule',
      message: 'Are you sure you want to permanently delete this shipping rule range?',
      confirmText: 'Delete Rule',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteShippingRule(id).unwrap();
          showToast('Shipping rule deleted successfully!', 'success');
          if (refetchShippingRules) refetchShippingRules();
        } catch (err) {
          showToast(err.data?.message || 'Failed to delete shipping rule.', 'error');
        }
      }
    });
  };

  const [couponTab, setCouponTab] = useState('standard'); // 'standard' or 'random'
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDescription, setCouponDescription] = useState('');
  const [couponDiscountType, setCouponDiscountType] = useState('flat'); // 'flat', 'percentage'
  const [couponDiscountValue, setCouponDiscountValue] = useState(0);
  const [couponMinOrderValue, setCouponMinOrderValue] = useState(0);
  const [couponMaxDiscount, setCouponMaxDiscount] = useState('');
  const [couponStartDate, setCouponStartDate] = useState('');
  const [couponEndDate, setCouponEndDate] = useState('');
  const [couponUsageLimit, setCouponUsageLimit] = useState('');
  const [couponUserLimit, setCouponUserLimit] = useState(1);
  const [couponFirstNOrders, setCouponFirstNOrders] = useState(0);

  const [editingSlide, setEditingSlide] = useState(null);
  const [slideTagline, setSlideTagline] = useState('');
  const [slideTitle, setSlideTitle] = useState('');
  const [slideTitleAccent, setSlideTitleAccent] = useState('');
  const [slideDescription, setSlideDescription] = useState('');
  const [slideCtaText, setSlideCtaText] = useState('');
  const [slideCtaLink, setSlideCtaLink] = useState('');
  const [slideSecondaryCtaText, setSlideSecondaryCtaText] = useState('');
  const [slideSecondaryCtaLink, setSlideSecondaryCtaLink] = useState('');
  const [slideCategoryName, setSlideCategoryName] = useState('');
  const [slideCategorySlug, setSlideCategorySlug] = useState('');
  const [slideGlowColor1, setSlideGlowColor1] = useState('bg-cyan-500/10');
  const [slideGlowColor2, setSlideGlowColor2] = useState('bg-orange-500/10');
  const [slideOrder, setSlideOrder] = useState(0);
  const [slideSelectedProducts, setSlideSelectedProducts] = useState([]);
  const [slideSearchQuery, setSlideSearchQuery] = useState('');

  const resetSlideForm = () => {
    setEditingSlide(null);
    setSlideTagline('');
    setSlideTitle('');
    setSlideTitleAccent('');
    setSlideDescription('');
    setSlideCtaText('');
    setSlideCtaLink('');
    setSlideSecondaryCtaText('');
    setSlideSecondaryCtaLink('');
    setSlideCategoryName('');
    setSlideCategorySlug('');
    setSlideGlowColor1('bg-cyan-500/10');
    setSlideGlowColor2('bg-orange-500/10');
    setSlideOrder(0);
    setSlideSelectedProducts([]);
    setSlideSearchQuery('');
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!slideTagline || !slideTitle || !slideTitleAccent || !slideDescription || !slideCtaText || !slideCtaLink) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    const slideData = {
      tagline: slideTagline,
      title: slideTitle,
      titleAccent: slideTitleAccent,
      description: slideDescription,
      ctaText: slideCtaText,
      ctaLink: slideCtaLink,
      secondaryCtaText: slideSecondaryCtaText,
      secondaryCtaLink: slideSecondaryCtaLink,
      categoryName: slideCategoryName,
      categorySlug: slideCategorySlug || null,
      glowColor1: slideGlowColor1,
      glowColor2: slideGlowColor2,
      order: Number(slideOrder),
      products: slideSelectedProducts
    };

    try {
      if (editingSlide) {
        await updateHeroSlide({ id: editingSlide._id, ...slideData }).unwrap();
        showToast('Hero slide updated successfully!', 'success');
      } else {
        await createHeroSlide(slideData).unwrap();
        showToast('Hero slide created successfully!', 'success');
      }
      resetSlideForm();
      if (refetchSlides) refetchSlides();
    } catch (err) {
      showToast(err.data?.message || 'Failed to save hero slide.', 'error');
    }
  };

  const handleEditSlide = (slide) => {
    setEditingSlide(slide);
    setSlideTagline(slide.tagline);
    setSlideTitle(slide.title);
    setSlideTitleAccent(slide.titleAccent);
    setSlideDescription(slide.description);
    setSlideCtaText(slide.ctaText);
    setSlideCtaLink(slide.ctaLink);
    setSlideSecondaryCtaText(slide.secondaryCtaText || '');
    setSlideSecondaryCtaLink(slide.secondaryCtaLink || '');
    setSlideCategoryName(slide.categoryName || '');
    setSlideCategorySlug(slide.categorySlug || '');
    setSlideGlowColor1(slide.glowColor1 || 'bg-cyan-500/10');
    setSlideGlowColor2(slide.glowColor2 || 'bg-orange-500/10');
    setSlideOrder(slide.order || 0);
    setSlideSelectedProducts(slide.products?.map(p => p._id || p) || []);
  };

  const handleDeleteSlide = (slideId) => {
    triggerConfirmation({
      title: 'Delete Hero Slide',
      message: 'Are you sure you want to delete this hero slide? This will remove it from the home page carousel.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteHeroSlide(slideId).unwrap();
          showToast('Hero slide deleted successfully!', 'success');
          if (refetchSlides) refetchSlides();
        } catch (err) {
          showToast(err.data?.message || 'Failed to delete hero slide.', 'error');
        }
      }
    });
  };

  const resetCouponForm = () => {
    setEditingCoupon(null);
    setCouponCode('');
    setCouponDescription('');
    setCouponDiscountType('flat');
    setCouponDiscountValue(0);
    setCouponMinOrderValue(0);
    setCouponMaxDiscount('');
    setCouponStartDate('');
    setCouponEndDate('');
    setCouponUsageLimit('');
    setCouponUserLimit(1);
    setCouponFirstNOrders(0);
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setCouponCode(coupon.code);
    setCouponDescription(coupon.description || '');
    setCouponDiscountType(coupon.discountType);
    setCouponDiscountValue(coupon.discountValue);
    setCouponMinOrderValue(coupon.minOrderValue || 0);
    setCouponMaxDiscount(coupon.maxDiscount || '');
    setCouponStartDate(new Date(coupon.startDate).toISOString().split('T')[0]);
    setCouponEndDate(new Date(coupon.endDate).toISOString().split('T')[0]);
    setCouponUsageLimit(coupon.usageLimit || '');
    setCouponUserLimit(coupon.userLimit || 1);
    setCouponFirstNOrders(coupon.firstNOrders || 0);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      showToast('Coupon code is required.', 'error');
      return;
    }
    if (!couponStartDate || !couponEndDate) {
      showToast('Start and end dates are required.', 'error');
      return;
    }

    const payload = {
      code: couponCode.toUpperCase().trim(),
      description: couponDescription,
      discountType: couponDiscountType,
      discountValue: Number(couponDiscountValue),
      minOrderValue: Number(couponMinOrderValue),
      maxDiscount: couponMaxDiscount ? Number(couponMaxDiscount) : undefined,
      startDate: new Date(couponStartDate).toISOString(),
      endDate: new Date(couponEndDate).toISOString(),
      usageLimit: couponUsageLimit ? Number(couponUsageLimit) : undefined,
      userLimit: Number(couponUserLimit),
      firstNOrders: Number(couponFirstNOrders),
      isRandomPool: couponTab === 'random',
    };

    try {
      if (editingCoupon) {
        await updateCoupon({ id: editingCoupon._id, ...payload }).unwrap();
        showToast('Coupon updated successfully.', 'success');
      } else {
        await createCoupon(payload).unwrap();
        showToast('Coupon created successfully.', 'success');
      }
      resetCouponForm();
      if (refetchCoupons) refetchCoupons();
    } catch (err) {
      showToast(err.data?.message || 'Failed to save coupon.', 'error');
    }
  };

  const handleToggleCouponActive = async (coupon) => {
    try {
      await updateCoupon({ id: coupon._id, active: !coupon.active }).unwrap();
      showToast(`Coupon "${coupon.code}" ${!coupon.active ? 'enabled' : 'disabled'} successfully.`, 'success');
      if (refetchCoupons) refetchCoupons();
    } catch (err) {
      showToast(err.data?.message || 'Failed to update coupon status.', 'error');
    }
  };

  const handleDeleteCoupon = (couponId, couponCode) => {
    triggerConfirmation({
      title: 'Delete Coupon Code',
      message: `Are you sure you want to permanently delete coupon "${couponCode}"? This action cannot be undone.`,
      confirmText: 'Delete Coupon',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteCoupon(couponId).unwrap();
          showToast(`Coupon "${couponCode}" deleted successfully.`, 'success');
          if (refetchCoupons) refetchCoupons();
        } catch (err) {
          showToast(err.data?.message || 'Failed to delete coupon.', 'error');
        }
      }
    });
  };

  const { data: categoriesRes, refetch: refetchCategories } = useGetCategoriesQuery(undefined, { skip: activeTab !== 'categories' || !isAdmin || !mounted });
  const { data: adminOrdersRes, refetch: refetchAdminOrders, isLoading: ordersLoading } = useGetAdminOrdersQuery(
    undefined,
    {
      skip:
        (activeTab !== 'orders' &&
          activeTab !== 'delivery' &&
          (activeTab !== 'overview' || !['sales', 'rejections'].includes(selectedMetric))) ||
        !isAdmin ||
        !mounted,
    }
  );
  const adminOrdersList = adminOrdersRes?.data?.orders || [];
  const { data: customersRes, refetch: refetchCustomers, isLoading: customersLoading } = useGetAdminUsersQuery(
    { role: 'customer' },
    {
      skip:
        (activeTab !== 'overview' || selectedMetric !== 'customers') ||
        !isAdmin ||
        !mounted,
    }
  );
  const adminOrders = adminOrdersRes?.data?.orders || [];
  const [expandedOrders, setExpandedOrders] = useState({});

  // Admin seller/product mutations
  const [createSellerDirectly] = useCreateSellerDirectlyMutation();
  const [deleteSeller] = useDeleteSellerMutation();
  const [deleteProductApi] = useDeleteProductMutation();

  const [showAddSellerForm, setShowAddSellerForm] = useState(false);
  const [newSellerMsg, setNewSellerMsg] = useState('');
  const [newSellerError, setNewSellerError] = useState('');

  const [newSellerData, setNewSellerData] = useState({
    name: '', email: '', password: '', phoneNumber: '',
    storeName: '', storeDescription: '', gstin: '', pan: '',
    bankAccountNumber: '', bankIfsc: '', bankName: '', bankAccountHolderName: '',
    street: '', city: '', state: '', country: '', postalCode: ''
  });

  const handleDeleteSeller = async (id) => {
    triggerConfirmation({
      title: 'Remove Seller Profile?',
      message: 'Are you sure you want to remove this seller profile? All associated products will be deleted, and the user account role will be reverted to customer. This action cannot be undone.',
      type: 'danger',
      confirmText: 'Remove Seller',
      onConfirm: async () => {
        try {
          await deleteSeller(id).unwrap();
          showToast('Seller profile removed successfully.', 'success');
          refetchSellers();
        } catch (err) {
          showToast(err.data?.message || 'Failed to delete seller.', 'error');
        }
      }
    });
  };

  const handleDeleteProduct = async (id) => {
    triggerConfirmation({
      title: 'Delete Product Listing?',
      message: 'Are you sure you want to delete this product listing? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Product',
      onConfirm: async () => {
        try {
          await deleteProductApi(id).unwrap();
          showToast('Product listing deleted successfully.', 'success');
          refetchProducts();
        } catch (err) {
          showToast(err.data?.message || 'Failed to delete product.', 'error');
        }
      }
    });
  };

  const handleAddSellerDirectly = async (e) => {
    e.preventDefault();
    
    // Validate password strength
    const password = newSellerData.password;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setNewSellerError('Password must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      showToast('Weak password.', 'error');
      return;
    }

    triggerConfirmation({
      title: 'Register New Seller Store?',
      message: `Are you sure you want to register and approve the seller store "${newSellerData.storeName}" directly?`,
      type: 'info',
      confirmText: 'Register Store',
      onConfirm: async () => {
        setNewSellerMsg('');
        setNewSellerError('');
        try {
          await createSellerDirectly(newSellerData).unwrap();
          showToast('Seller store registered and approved successfully!', 'success');
          setNewSellerMsg('Seller store registered and approved successfully!');
          refetchSellers();
          setShowAddSellerForm(false);
          setNewSellerData({
            name: '', email: '', password: '', phoneNumber: '',
            storeName: '', storeDescription: '', gstin: '', pan: '',
            bankAccountNumber: '', bankIfsc: '', bankName: '', bankAccountHolderName: '',
            street: '', city: '', state: '', country: '', postalCode: ''
          });
        } catch (err) {
          showToast(err.data?.message || 'Failed to register seller store.', 'error');
          setNewSellerError(err.data?.message || 'Failed to register seller store.');
        }
      }
    });
  };

  // Category mutations
  const [createCategoryApi] = useCreateCategoryMutation();
  const [updateCategoryApi] = useUpdateCategoryMutation();
  const [deleteCategoryApi] = useDeleteCategoryMutation();

  // Category local state
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [categorySuccess, setCategorySuccess] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Profile update mutations
  const [updateProfileApi] = useUpdateProfileMutation();
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess(false);
    try {
      const res = await updateProfileApi({ name, phoneNumber }).unwrap();
      dispatch(updateUser(res.data.user));
      showToast('Profile updated successfully!', 'success');
      setProfileSuccess(true);
    } catch (err) {
      showToast('Failed to update profile.', 'error');
    }
  };

  const handleSaveCartSettings = async (e) => {
    e.preventDefault();
    setSettingsSuccess('');
    setSettingsError('');
    try {
      await updateCartLimitsMutation({
        minCheckoutValue: Number(minCheckoutValInput),
        minCodValue: Number(minCodValInput),
        defaultDeliveryAgent: defaultAgentInput || ''
      }).unwrap();
      setSettingsSuccess('Cart settings updated successfully!');
      showToast('Cart settings updated successfully!', 'success');
      setTimeout(() => setSettingsSuccess(''), 3000);
    } catch (err) {
      setSettingsError(err.data?.message || 'Failed to save settings.');
      showToast(err.data?.message || 'Failed to save settings.', 'error');
    }
  };

  const handleApproveDelivery = async (id, status) => {
    try {
      await approveDeliveryPartner({ id, status }).unwrap();
      showToast(`Delivery partner application ${status} successfully!`, 'success');
      refetchDeliveryApplications();
      refetchDeliveryPartners?.();
    } catch (err) {
      showToast(err.data?.message || 'Failed to update application status.', 'error');
    }
  };

  const handleAssignPartner = async (orderId, deliveryPartnerId) => {
    try {
      await assignDeliveryPartner({ orderId, deliveryPartnerId }).unwrap();
      showToast('Delivery partner assigned successfully!', 'success');
      refetchAdminOrders?.();
    } catch (err) {
      showToast(err.data?.message || 'Failed to assign delivery partner.', 'error');
    }
  };

  // Mutations
  const [approveSeller] = useApproveSellerMutation();
  const [approveProduct] = useApproveProductMutation();

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) {
      setCategoryError('Category Name and Slug are required.');
      return;
    }

    triggerConfirmation({
      title: editingCategory ? 'Update Category?' : 'Create Category?',
      message: editingCategory
        ? `Are you sure you want to update the category details to "${catName.trim()}"?`
        : `Are you sure you want to create a new category named "${catName.trim()}"?`,
      type: 'info',
      confirmText: editingCategory ? 'Update' : 'Create',
      onConfirm: async () => {
        setCategorySuccess('');
        setCategoryError('');
        try {
          if (editingCategory) {
            await updateCategoryApi({
              id: editingCategory._id,
              name: catName.trim(),
              slug: catSlug.trim().toLowerCase(),
              description: catDescription.trim(),
            }).unwrap();
            showToast('Category updated successfully!', 'success');
            setCategorySuccess('Category updated successfully!');
          } else {
            await createCategoryApi({
              name: catName.trim(),
              slug: catSlug.trim().toLowerCase(),
              description: catDescription.trim(),
            }).unwrap();
            showToast('Category created successfully!', 'success');
            setCategorySuccess('Category created successfully!');
          }
          
          setCatName('');
          setCatSlug('');
          setCatDescription('');
          setEditingCategory(null);
          refetchCategories();
        } catch (err) {
          showToast(err.data?.message || 'Failed to save category.', 'error');
          setCategoryError(err.data?.message || 'Failed to save category.');
        }
      }
    });
  };

  const handleEditClick = (cat) => {
    setCategorySuccess('');
    setCategoryError('');
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDescription(cat.description || '');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatDescription('');
    setCategorySuccess('');
    setCategoryError('');
  };

  const handleDeleteCategory = async (id) => {
    triggerConfirmation({
      title: 'Delete Category?',
      message: 'Are you sure you want to delete this category? All products under this category will need new categories assigned.',
      type: 'danger',
      confirmText: 'Delete Category',
      onConfirm: async () => {
        setCategorySuccess('');
        setCategoryError('');
        try {
          await deleteCategoryApi(id).unwrap();
          showToast('Category deleted successfully!', 'success');
          setCategorySuccess('Category deleted successfully!');
          refetchCategories();
        } catch (err) {
          showToast(err.data?.message || 'Failed to delete category.', 'error');
          setCategoryError(err.data?.message || 'Failed to delete category.');
        }
      }
    });
  };

  const stats = statsRes?.data?.stats || { totalCustomers: 0, totalSellers: 0, totalOrders: 0, totalSales: 0, rejectedBySellersCount: 0 };
  const sellersList = sellersRes?.data?.sellers || [];
  const pendingProducts = productsRes?.data?.products || [];
  const categoriesList = categoriesRes?.data?.categories || [];

  const ordersList = adminOrdersRes?.data?.orders || [];
  const salesOrders = ordersList.filter(order => 
    ['placed', 'processed', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status)
  );
  
  const filteredSalesOrders = salesOrders.filter(order => {
    const query = metricSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (order.orderId || '').toLowerCase().includes(query) ||
      (order.customer?.name || '').toLowerCase().includes(query) ||
      (order.customer?.email || '').toLowerCase().includes(query) ||
      (order.status || '').toLowerCase().includes(query) ||
      new Date(order.createdAt).toLocaleDateString('en-IN').includes(query)
    );
  });

  const customersList = customersRes?.data?.users || [];
  const filteredCustomers = customersList.filter(user => {
    const query = metricSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (user.name || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query) ||
      (user.phoneNumber || '').toLowerCase().includes(query) ||
      (user.referralCode || '').toLowerCase().includes(query) ||
      new Date(user.createdAt).toLocaleDateString('en-IN').includes(query)
    );
  });

  const rejectionOrders = ordersList.filter(order => 
    order.statusTimeline?.some(event => 
      event.status === 'cancelled' && event.message === 'Order rejected by seller.'
    )
  );
  
  const filteredRejections = rejectionOrders.filter(order => {
    const query = metricSearchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const cancelEvent = order.statusTimeline?.find(event => 
      event.status === 'cancelled' && event.message === 'Order rejected by seller.'
    );
    const cancelReason = cancelEvent?.message || 'Order rejected by seller.';
    
    return (
      (order.orderId || '').toLowerCase().includes(query) ||
      (order.customer?.name || '').toLowerCase().includes(query) ||
      (order.customer?.email || '').toLowerCase().includes(query) ||
      cancelReason.toLowerCase().includes(query) ||
      new Date(order.createdAt).toLocaleDateString('en-IN').includes(query)
    );
  });

  const renderCountMessage = () => {
    if (selectedMetric === 'sales') {
      return `Showing ${filteredSalesOrders.length} of ${salesOrders.length} records`;
    }
    if (selectedMetric === 'customers') {
      return `Showing ${filteredCustomers.length} of ${customersList.length} records`;
    }
    if (selectedMetric === 'rejections') {
      return `Showing ${filteredRejections.length} of ${rejectionOrders.length} records`;
    }
    return '';
  };

  const isMetricLoading = 
    (selectedMetric === 'customers' && customersLoading) ||
    ((selectedMetric === 'sales' || selectedMetric === 'rejections') && ordersLoading);

  const renderMetricTable = () => {
    if (isMetricLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xxs text-slate-500 font-semibold">Loading records...</p>
        </div>
      );
    }

    if (selectedMetric === 'sales') {
      if (filteredSalesOrders.length === 0) {
        return <p className="text-xs text-slate-400 italic py-4">No matching sales records found.</p>;
      }
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Order ID</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Customer</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Date</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Total Sales</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalesOrders.map((order) => (
                <tr key={order._id} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                  <td className="py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200">{order.orderId}</td>
                  <td className="py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
                    <div>{order.customer?.name || 'Guest'}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{order.customer?.email}</div>
                  </td>
                  <td className="py-3.5 text-xs font-semibold text-slate-650 dark:text-slate-405">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200">₹{order.pricing?.total?.toLocaleString('en-IN') || '0'}</td>
                  <td className="py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                      order.status === 'processed' || order.status === 'shipped' || order.status === 'delivered'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                        : 'bg-orange-50 dark:bg-orange-950/40 text-orange-600'
                    }`}>
                      {order.status === 'processed' ? 'Approved' : order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (selectedMetric === 'customers') {
      if (filteredCustomers.length === 0) {
        return <p className="text-xs text-slate-400 italic py-4">No matching customer profiles found.</p>;
      }
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Name</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Email</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Phone</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Joined Date</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Referral Code</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider text-right">Wallet Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((user) => (
                <tr key={user._id} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                  <td className="py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</td>
                  <td className="py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-350">{user.email}</td>
                  <td className="py-3.5 text-xs font-semibold text-slate-650 dark:text-slate-405">{user.phoneNumber || '-'}</td>
                  <td className="py-3.5 text-xs font-semibold text-slate-650 dark:text-slate-405">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">{user.referralCode || '-'}</td>
                  <td className="py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200 text-right">₹{user.wallet?.balance?.toLocaleString('en-IN') || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (selectedMetric === 'rejections') {
      if (filteredRejections.length === 0) {
        return <p className="text-xs text-slate-400 italic py-4">No matching rejected orders found.</p>;
      }
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Order ID</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Customer</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Date</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Amount</th>
                <th className="pb-3 text-xxs font-extrabold text-black dark:text-white uppercase tracking-wider">Rejection Info</th>
              </tr>
            </thead>
            <tbody>
              {filteredRejections.map((order) => {
                const cancelEvent = order.statusTimeline?.find(event => 
                  event.status === 'cancelled' && event.message === 'Order rejected by seller.'
                );
                return (
                  <tr key={order._id} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                    <td className="py-3.5 text-xs font-bold text-rose-600 dark:text-rose-400">{order.orderId}</td>
                    <td className="py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
                      <div>{order.customer?.name || 'Guest'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{order.customer?.email}</div>
                    </td>
                    <td className="py-3.5 text-xs font-semibold text-slate-650 dark:text-slate-405">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200">₹{order.pricing?.total?.toLocaleString('en-IN') || '0'}</td>
                    <td className="py-3.5 text-xs text-slate-550 dark:text-slate-400 font-semibold">
                      <div className="text-red-500 font-bold">Rejected by Seller</div>
                      {cancelEvent?.timestamp && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          Cancelled on: {new Date(cancelEvent.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF('p', 'pt', 'a4');
      const genDate = new Date().toLocaleString('en-IN');
      const adminEmail = user?.email || 'admin@daykart.com';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      let title = '';
      let dataRows = [];
      let headers = [];

      if (selectedMetric === 'sales') {
        title = 'Daykart Metrics Ledger: Total Sales';
        headers = [['Order ID', 'Customer Name', 'Customer Email', 'Order Date', 'Total Amount (INR)', 'Status']];
        dataRows = filteredSalesOrders.map(order => [
          order.orderId || '',
          order.customer?.name || 'Guest',
          order.customer?.email || '',
          new Date(order.createdAt).toLocaleDateString('en-IN'),
          `INR ${order.pricing?.total?.toLocaleString('en-IN') || '0'}`,
          order.status === 'processed' ? 'Approved' : order.status
        ]);
      } else if (selectedMetric === 'customers') {
        title = 'Daykart Metrics Ledger: Active Customers';
        headers = [['Name', 'Email', 'Phone Number', 'Joined Date', 'Referral Code', 'Wallet Balance (INR)']];
        dataRows = filteredCustomers.map(u => [
          u.name || '',
          u.email || '',
          u.phoneNumber || '-',
          new Date(u.createdAt).toLocaleDateString('en-IN'),
          u.referralCode || '-',
          `INR ${u.wallet?.balance?.toLocaleString('en-IN') || '0'}`
        ]);
      } else if (selectedMetric === 'rejections') {
        title = 'Daykart Metrics Ledger: Seller Rejections';
        headers = [['Order ID', 'Customer Name', 'Customer Email', 'Order Date', 'Amount (INR)', 'Rejection Date']];
        dataRows = filteredRejections.map(order => {
          const cancelEvent = order.statusTimeline?.find(event => 
            event.status === 'cancelled' && event.message === 'Order rejected by seller.'
          );
          return [
            order.orderId || '',
            order.customer?.name || 'Guest',
            order.customer?.email || '',
            new Date(order.createdAt).toLocaleDateString('en-IN'),
            `INR ${order.pricing?.total?.toLocaleString('en-IN') || '0'}`,
            cancelEvent?.timestamp ? new Date(cancelEvent.timestamp).toLocaleDateString('en-IN') : '-'
          ];
        });
      }

      doc.text(title, 40, 50);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${genDate}`, 40, 70);
      doc.text(`Exported by: ${adminEmail}`, 40, 85);
      doc.text(`Total Records Displayed: ${dataRows.length}`, 40, 100);

      autoTable(doc, {
        startY: 120,
        head: headers,
        body: dataRows,
        styles: {
          fontSize: 9,
          cellPadding: 6,
          valign: 'middle'
        },
        headStyles: {
          fillColor: [14, 116, 144],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: 40, right: 40 }
      });

      doc.save(`daykart-${selectedMetric}-logs.pdf`);
      showToast('Ledger report downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export PDF.', 'error');
    }
  };

  const filteredSellersList = sellersList.filter(sel => {
    if (sellerStatusFilter !== 'all' && sel.status !== sellerStatusFilter) {
      return false;
    }
    const query = sellerSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (sel.storeName || '').toLowerCase().includes(query) ||
      (sel.user?.name || '').toLowerCase().includes(query) ||
      (sel.user?.email || '').toLowerCase().includes(query) ||
      (sel.gstin || '').toLowerCase().includes(query) ||
      (sel.pan || '').toLowerCase().includes(query)
    );
  });

  const filteredProductsList = pendingProducts.filter(prod => {
    const query = productSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (prod.title || '').toLowerCase().includes(query) ||
      (prod.sku || '').toLowerCase().includes(query) ||
      (prod.brand || '').toLowerCase().includes(query) ||
      (prod.seller?.storeName || '').toLowerCase().includes(query)
    );
  });

  const filteredCouponsList = (couponsRes?.data?.coupons || [])
    .filter(c => couponTab === 'standard' ? !c.isRandomPool : c.isRandomPool)
    .filter(c => {
      if (couponStatusFilter === 'active' && !c.active) return false;
      if (couponStatusFilter === 'inactive' && c.active) return false;
      const query = couponSearchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        (c.code || '').toLowerCase().includes(query) ||
        (c.description || '').toLowerCase().includes(query)
      );
    });

  const shippingRules = shippingRulesRes?.data?.shippingRules || [];
  const filteredShippingRules = shippingRules.filter(rule => {
    const query = shippingSearchQuery.toLowerCase().trim();
    if (!query) return true;
    const chargeText = rule.charge === 0 ? 'free' : rule.charge.toString();
    const rangeText = `${rule.minCartValue} ${rule.maxCartValue || ''}`;
    return chargeText.includes(query) || rangeText.includes(query);
  });

  const handleDownloadSellersPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF('p', 'pt', 'a4');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Daykart Merchant Directory Report', 40, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 40, 70);
      doc.text(`Total Sellers Count: ${filteredSellersList.length}`, 40, 85);
      
      const headers = [['Store Name', 'Owner Name', 'Owner Email', 'GSTIN', 'PAN', 'Status']];
      const body = filteredSellersList.map(sel => [
        sel.storeName || '',
        sel.user?.name || '',
        sel.user?.email || '',
        sel.gstin || '',
        sel.pan || '',
        sel.status || ''
      ]);
      
      autoTable(doc, {
        startY: 105,
        head: headers,
        body: body,
        styles: { fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255] }
      });
      doc.save('daykart-sellers-report.pdf');
      showToast('Sellers report downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export Sellers PDF.', 'error');
    }
  };

  const handleDownloadProductsPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF('p', 'pt', 'a4');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Daykart Product Catalog Moderation Report', 40, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 40, 70);
      doc.text(`Total Filtered Products: ${filteredProductsList.length}`, 40, 85);
      
      const headers = [['Product Title', 'SKU', 'Seller Store', 'Price (INR)', 'Stock', 'Status']];
      const body = filteredProductsList.map(p => [
        p.title || '',
        p.sku || '',
        p.seller?.storeName || 'Platform',
        `INR ${p.price?.toLocaleString('en-IN')}`,
        p.stock ?? 0,
        p.status || ''
      ]);
      
      autoTable(doc, {
        startY: 105,
        head: headers,
        body: body,
        styles: { fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255] }
      });
      doc.save('daykart-products-moderation-report.pdf');
      showToast('Products report downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export Products PDF.', 'error');
    }
  };

  const handleDownloadCouponsPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF('p', 'pt', 'a4');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(`Daykart Coupon Registry Report (${couponTab === 'standard' ? 'Standard' : 'Random Pool'})`, 40, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 40, 70);
      doc.text(`Total Coupons Displayed: ${filteredCouponsList.length}`, 40, 85);
      
      const headers = [['Code', 'Discount Details', 'Valid Range', 'Usage Limit', 'Status']];
      const body = filteredCouponsList.map(c => [
        c.code || '',
        c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `INR ${c.discountValue} Flat`,
        `${new Date(c.startDate).toLocaleDateString('en-IN')} to ${new Date(c.endDate).toLocaleDateString('en-IN')}`,
        c.usageLimit || 'Unlimited',
        c.active ? 'Active' : 'Inactive'
      ]);
      
      autoTable(doc, {
        startY: 105,
        head: headers,
        body: body,
        styles: { fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255] }
      });
      doc.save(`daykart-coupons-${couponTab}-report.pdf`);
      showToast('Coupons report downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export Coupons PDF.', 'error');
    }
  };

  const handleDownloadShippingPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF('p', 'pt', 'a4');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Daykart Shipping Rates Policy Report', 40, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 40, 70);
      doc.text(`Total Shipping Rules: ${filteredShippingRules.length}`, 40, 85);
      
      const headers = [['Cart Subtotal Range (INR)', 'Shipping Charge (INR)']];
      const body = filteredShippingRules.map(rule => [
        rule.maxCartValue === null || rule.maxCartValue === undefined
          ? `INR ${rule.minCartValue} and above`
          : `INR ${rule.minCartValue} - INR ${rule.maxCartValue}`,
         rule.charge === 0 ? 'FREE SHIPPING' : `INR ${rule.charge}`
      ]);
      
      autoTable(doc, {
        startY: 105,
        head: headers,
        body: body,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255] }
      });
      doc.save('daykart-shipping-rates-report.pdf');
      showToast('Shipping rates report downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export Shipping PDF.', 'error');
    }
  };

  const handleDownloadReferralsPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF('p', 'pt', 'a4');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Daykart Customer Referral Audit Ledger', 40, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 40, 70);
      doc.text(`Total Referrals Count: ${filteredReferrals.length}`, 40, 85);
      
      const headers = [['Date', 'Referred User Name', 'Referred User Email', 'Referrer Name', 'Referrer Code']];
      const body = filteredReferrals.map(ref => [
        new Date(ref.createdAt).toLocaleDateString('en-IN'),
        ref.name || '',
        ref.email || '',
        ref.referredBy?.name || '',
        ref.referredBy?.referralCode || ''
      ]);
      
      autoTable(doc, {
        startY: 105,
        head: headers,
        body: body,
        styles: { fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255] }
      });
      doc.save('daykart-referrals-report.pdf');
      showToast('Referrals ledger downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export Referrals PDF.', 'error');
    }
  };

  const filteredAdminOrders = adminOrders.filter(order => {
    if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
      return false;
    }
    const query = orderSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (order.orderId || '').toLowerCase().includes(query) ||
      (order.customer?.name || '').toLowerCase().includes(query) ||
      (order.customer?.email || '').toLowerCase().includes(query)
    );
  });

  const deliveryPartners = deliveryPartnersRes?.data?.users || [];

  const handleDownloadOrdersPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF('p', 'pt', 'a4');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Daykart Platform Customer Orders Report', 40, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 40, 70);
      doc.text(`Total Filtered Orders: ${filteredAdminOrders.length}`, 40, 85);
      
      const headers = [['Order ID', 'Customer Name', 'Customer Email', 'Date', 'Total Amount', 'Status']];
      const body = filteredAdminOrders.map(order => [
        order.orderId || '',
        order.customer?.name || 'Guest',
        order.customer?.email || '',
        new Date(order.createdAt).toLocaleDateString('en-IN'),
        `INR ${order.pricing?.total?.toLocaleString('en-IN') || '0'}`,
        order.status || ''
      ]);
      
      autoTable(doc, {
        startY: 105,
        head: headers,
        body: body,
        styles: { fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255] }
      });
      doc.save('daykart-orders-report.pdf');
      showToast('Orders report downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export Orders PDF.', 'error');
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  if (!mounted || !isAdmin) {
    return null;
  }

  const handleSellerApproval = async (id, status) => {
    try {
      await approveSeller({ id, status }).unwrap();
      showToast(`Seller store has been ${status}.`, 'success');
      refetchSellers();
    } catch (err) {
      showToast('Action failed.', 'error');
    }
  };

  const handleProductApproval = async (id, status) => {
    try {
      await approveProduct({ id, status }).unwrap();
      showToast(`Product listing has been ${status}.`, 'success');
      refetchProducts();
    } catch (err) {
      showToast('Action failed.', 'error');
    }
  };

  const tabNames = {
    overview: 'Overview Metrics',
    approvals: 'Pending Approvals',
    sellers: 'Moderate Sellers',
    products: 'Moderate Products',
    orders: 'Customer Orders',
    categories: 'Manage Categories',
    carousel: 'Manage Carousel',
    coupons: 'Manage Coupons',
    shipping: 'Manage Shipping',
    referrals: 'Manage Referrals',
    wallet: 'Admin Wallet',
    tickets: 'Support Tickets',
    delivery: 'Delivery Partners',
    settings: 'Cart Settings',
    profile: 'Profile Details'
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">Admin Control Panel</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Mobile/Tablet Tab Dropdown Selector */}
          <div className="lg:hidden w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <label className="block text-xxs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Select Control Section
            </label>
            <div className="relative">
              <button
                onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none focus:border-secondary transition-all flex items-center justify-between cursor-pointer"
              >
                <span>{tabNames[activeTab]}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${isTabDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTabDropdownOpen && (
                <>
                  {/* Backdrop to close the dropdown when clicking outside */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsTabDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 mt-2 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden py-1 max-h-60 overflow-y-auto">
                    {Object.entries(tabNames).map(([key, name]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setActiveTab(key);
                          setIsTabDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all ${
                          activeTab === key
                            ? 'bg-secondary text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Desktop Sidebar Tabs */}
          <div className="hidden lg:flex lg:flex-col space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" /> Overview Metrics
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'approvals'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4.5 h-4.5" /> Pending Approvals
            </button>
            <button
              onClick={() => setActiveTab('sellers')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'sellers'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4.5 h-4.5" /> Moderate Sellers
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ShoppingBag className="w-4.5 h-4.5" /> Moderate Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ClipboardList className="w-4.5 h-4.5" /> Customer Orders
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <FolderOpen className="w-4.5 h-4.5" /> Manage Categories
            </button>
            <button
              onClick={() => setActiveTab('carousel')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'carousel'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4.5 h-4.5" /> Manage Carousel
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'coupons'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Tag className="w-4.5 h-4.5" /> Manage Coupons
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'shipping'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Truck className="w-4.5 h-4.5" /> Manage Shipping
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'referrals'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Gift className="w-4.5 h-4.5" /> Manage Referrals
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'wallet'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Wallet className="w-4.5 h-4.5" /> Admin Wallet
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'tickets'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4.5 h-4.5" /> Support Tickets
            </button>
            <button
              onClick={() => setActiveTab('delivery')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'delivery'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Truck className="w-4.5 h-4.5" /> Delivery Partners
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4.5 h-4.5" /> Cart Settings
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-4.5 h-4.5" /> Profile Details
            </button>
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              /* Overview Stats Dashboard */
              <div className="space-y-6">
                {/* Header card with Refresh Button */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between animate-fade-in">
                  <div>
                    <h3 className="font-extrabold text-base text-black dark:text-white flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-secondary" /> Admin Overview
                    </h3>
                    <p className="text-xxs text-slate-400 mt-1">Platform metrics, transaction data, analytics and stats.</p>
                  </div>
                  <button
                    onClick={() => refetchStats()}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-250 rounded-xl transition-all"
                    title="Refresh Stats"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {statsLoading ? (
                  <div className="text-sm text-slate-400 animate-pulse">Loading Platform Analytics...</div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
                      {/* Total Sales Card */}
                      <div 
                        onClick={() => {
                          setSelectedMetric(selectedMetric === 'sales' ? null : 'sales');
                          setMetricSearchQuery('');
                        }}
                        className={`p-6 rounded-2xl text-center select-none ${
                          selectedMetric === 'sales'
                            ? 'border-2 border-secondary bg-cyan-50/10 dark:bg-cyan-950/10 shadow-md'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-secondary dark:hover:border-cyan-600 hover:shadow-md'
                        } transition-all duration-200`}
                      >
                        <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Sales</p>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">₹{stats.totalSales.toLocaleString('en-IN')}</h2>
                      </div>

                      {/* Active Customers Card */}
                      <div 
                        onClick={() => {
                          setSelectedMetric(selectedMetric === 'customers' ? null : 'customers');
                          setMetricSearchQuery('');
                        }}
                        className={`p-6 rounded-2xl text-center select-none ${
                          selectedMetric === 'customers'
                            ? 'border-2 border-secondary bg-cyan-50/10 dark:bg-cyan-950/10 shadow-md'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-secondary dark:hover:border-cyan-600 hover:shadow-md'
                        } transition-all duration-200`}
                      >
                        <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Active Customers</p>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.totalCustomers}</h2>
                      </div>

                      {/* Registered Sellers Card */}
                      <div 
                        onClick={() => setActiveTab('sellers')}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center cursor-pointer hover:border-secondary dark:hover:border-cyan-600 hover:shadow-md transition-all duration-200 select-none"
                      >
                        <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Registered Sellers</p>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.totalSellers}</h2>
                      </div>

                      {/* Total Orders Card */}
                      <div 
                        onClick={() => setActiveTab('orders')}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center cursor-pointer hover:border-secondary dark:hover:border-cyan-600 hover:shadow-md transition-all duration-200 select-none"
                      >
                        <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.totalOrders}</h2>
                      </div>

                      {/* Seller Rejections Card */}
                      <div 
                        onClick={() => {
                          setSelectedMetric(selectedMetric === 'rejections' ? null : 'rejections');
                          setMetricSearchQuery('');
                        }}
                        className={`p-6 rounded-2xl text-center select-none ${
                          selectedMetric === 'rejections'
                            ? 'border-2 border-secondary bg-cyan-50/10 dark:bg-cyan-950/10 shadow-md'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-secondary dark:hover:border-cyan-600 hover:shadow-md'
                        } transition-all duration-200`}
                      >
                        <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Seller Rejections</p>
                        <h2 className={`text-xl font-extrabold mt-2 ${selectedMetric === 'rejections' ? 'text-rose-500 font-black' : 'text-rose-600'}`}>{stats.rejectedBySellersCount || 0}</h2>
                      </div>
                    </div>

                    {/* Drill-down Detail Log Ledger Panel */}
                    {selectedMetric && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm mt-8 space-y-6 animate-fadeIn">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                          <div>
                            <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-150 capitalize">
                              Detailed Logs: {selectedMetric === 'sales' ? 'Total Sales' : selectedMetric === 'customers' ? 'Active Customers' : 'Seller Rejections'}
                            </h3>
                            <p className="text-xxs text-slate-500 font-semibold mt-1">
                              {renderCountMessage()}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            {/* Search Input */}
                            <div className="relative flex-grow sm:flex-grow-0">
                              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                              <input
                                type="text"
                                placeholder="Search logs..."
                                value={metricSearchQuery}
                                onChange={(e) => setMetricSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 w-full sm:w-60 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-secondary dark:focus:border-cyan-600 transition text-slate-855 dark:text-slate-155"
                              />
                            </div>

                            {/* Download PDF Button */}
                            <button
                              onClick={handleDownloadPDF}
                              className="bg-secondary hover:bg-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              Download PDF
                            </button>

                            {/* Close Logs Button */}
                            <button
                              onClick={() => {
                                setSelectedMetric(null);
                                setMetricSearchQuery('');
                              }}
                              className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 px-4 py-2 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-350 transition cursor-pointer"
                            >
                              Close Logs
                            </button>
                          </div>
                        </div>

                        {/* Table Logs */}
                        {renderMetricTable()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sellers' && (
              /* Sellers list and approvals */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  {/* Row 1: Title & Main Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
                      Seller Registrations
                      <span className="text-[10px] font-bold bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full">
                        {filteredSellersList.length} {filteredSellersList.length === 1 ? 'store' : 'stores'}
                      </span>
                      <button 
                        onClick={() => refetchSellers()}
                        className="text-slate-500 hover:text-secondary p-1 rounded-lg transition"
                        title="Refresh Sellers"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </h3>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                      {/* Download PDF Button */}
                      <button
                        onClick={handleDownloadSellersPDF}
                        className="flex-1 sm:flex-initial justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xxs font-bold text-slate-700 dark:text-slate-350 transition flex items-center gap-1 cursor-pointer"
                      >
                        Download PDF
                      </button>

                      {/* Add Seller Button */}
                      <button 
                        onClick={() => setShowAddSellerForm(!showAddSellerForm)}
                        className="flex-1 sm:flex-initial justify-center bg-secondary text-white px-3.5 py-1.5 rounded-xl text-xxs font-bold hover:bg-cyan-600 transition flex items-center gap-1 select-none"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Seller
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Filters & Search */}
                  <div className="flex flex-row items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/45 p-1.5 md:p-2.5 rounded-2xl">
                    <div className="flex items-center gap-2 w-[28%] md:w-auto flex-shrink-0">
                      <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:inline">Status:</span>
                      <select
                        value={sellerStatusFilter}
                        onChange={(e) => setSellerStatusFilter(e.target.value)}
                        className="w-full md:w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 md:px-3 py-1 md:py-1.5 rounded-xl text-xxs font-semibold focus:outline-none focus:border-secondary transition-all text-slate-855 dark:text-white cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-grow w-[72%] md:max-w-xs">
                      <input
                        type="text"
                        placeholder="Search store, owner..."
                        value={sellerSearchQuery}
                        onChange={(e) => setSellerSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-7 pr-2 md:pl-8 md:pr-3 py-1 md:py-1.5 rounded-xl text-xxs font-semibold focus:outline-none focus:border-secondary transition-all text-black dark:text-white"
                      />
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {newSellerMsg && (
                  <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-xs text-emerald-600">
                    {newSellerMsg}
                  </div>
                )}
                {newSellerError && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs text-red-600">
                    {newSellerError}
                  </div>
                )}

                {showAddSellerForm && (
                  <form onSubmit={handleAddSellerDirectly} className="mb-6 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">Register New Seller Store</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Owner Name</label>
                        <input 
                          type="text" 
                          required 
                          value={newSellerData.name}
                          onChange={(e) => setNewSellerData({...newSellerData, name: e.target.value})}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Owner Email</label>
                        <input 
                          type="email" 
                          required 
                          value={newSellerData.email}
                          onChange={(e) => setNewSellerData({...newSellerData, email: e.target.value})}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                        <input 
                          type="password" 
                          required 
                          value={newSellerData.password}
                          onChange={(e) => setNewSellerData({...newSellerData, password: e.target.value})}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                        <input 
                          type="text" 
                          required 
                          value={newSellerData.phoneNumber}
                          onChange={(e) => setNewSellerData({...newSellerData, phoneNumber: e.target.value})}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Store Name</label>
                        <input 
                          type="text" 
                          required 
                          value={newSellerData.storeName}
                          onChange={(e) => setNewSellerData({...newSellerData, storeName: e.target.value})}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Store Description</label>
                        <input 
                          type="text" 
                          value={newSellerData.storeDescription}
                          onChange={(e) => setNewSellerData({...newSellerData, storeDescription: e.target.value})}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">GSTIN</label>
                        <input 
                          type="text" 
                          required 
                          value={newSellerData.gstin}
                          onChange={(e) => setNewSellerData({...newSellerData, gstin: e.target.value})}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">PAN</label>
                        <input 
                          type="text" 
                          required 
                          value={newSellerData.pan}
                          onChange={(e) => setNewSellerData({...newSellerData, pan: e.target.value})}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Bank Account Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Holder Name</label>
                          <input 
                            type="text" 
                            required 
                            value={newSellerData.bankAccountHolderName}
                            onChange={(e) => setNewSellerData({...newSellerData, bankAccountHolderName: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Bank Name</label>
                          <input 
                            type="text" 
                            required 
                            value={newSellerData.bankName}
                            onChange={(e) => setNewSellerData({...newSellerData, bankName: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Account Number</label>
                          <input 
                            type="text" 
                            required 
                            value={newSellerData.bankAccountNumber}
                            onChange={(e) => setNewSellerData({...newSellerData, bankAccountNumber: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">IFSC Code</label>
                          <input 
                            type="text" 
                            required 
                            value={newSellerData.bankIfsc}
                            onChange={(e) => setNewSellerData({...newSellerData, bankIfsc: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Registered Store Address</h5>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
                        <div className="md:col-span-2">
                          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Street Address</label>
                          <input 
                            type="text" 
                            required 
                            value={newSellerData.street}
                            onChange={(e) => setNewSellerData({...newSellerData, street: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">City</label>
                          <input 
                            type="text" 
                            required 
                            value={newSellerData.city}
                            onChange={(e) => setNewSellerData({...newSellerData, city: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">State</label>
                          <input 
                            type="text" 
                            required 
                            value={newSellerData.state}
                            onChange={(e) => setNewSellerData({...newSellerData, state: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">Postal Code</label>
                          <input 
                            type="text" 
                            required 
                            value={newSellerData.postalCode}
                            onChange={(e) => setNewSellerData({...newSellerData, postalCode: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-secondary transition dark:text-slate-200"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3">
                      <button 
                        type="button" 
                        onClick={() => setShowAddSellerForm(false)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition dark:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-secondary text-white rounded-xl hover:bg-cyan-600 text-xs font-bold transition"
                      >
                        Register Store
                      </button>
                    </div>
                  </form>
                )}

                {filteredSellersList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No registered sellers found matching criteria.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredSellersList.map(sel => (
                      <div key={sel._id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-start bg-slate-50/20 dark:bg-slate-900/10 relative pr-14 sm:pr-24">
                        <div className="text-xs space-y-1.5 flex-grow">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{sel.storeName}</span>
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                              sel.status === 'approved'
                                ? 'bg-emerald-50/55 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                                : sel.status === 'pending'
                                  ? 'bg-orange-50/55 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30'
                                  : 'bg-red-50/55 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
                            }`}>
                              {sel.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 sm:gap-x-4 text-slate-500 font-medium text-[11px] leading-relaxed">
                            <div>
                              <span className="text-slate-400 font-semibold mr-1">Owner Email:</span>
                              <span className="text-slate-700 dark:text-slate-350">{sel.user?.email || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold mr-1">GSTIN:</span>
                              <code className="text-slate-700 dark:text-slate-350 font-mono">{sel.gstin}</code>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold mr-1">PAN:</span>
                              <code className="text-slate-700 dark:text-slate-350 font-mono">{sel.pan}</code>
                            </div>
                          </div>
                        </div>

                        <div className="absolute top-4 right-4 flex gap-2 items-center">
                          {sel.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleSellerApproval(sel._id, 'approved')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition"
                                title="Approve Store"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleSellerApproval(sel._id, 'rejected')}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition"
                                title="Reject Store"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteSeller(sel._id)}
                            className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-xl transition"
                            title="Remove Seller Profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'products' && (
              /* Moderate Products list and approvals/deletion */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  {/* Row 1: Title & Main Action Button */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
                      Moderate Product Catalog
                      <span className="text-[10px] font-bold bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full">
                        {filteredProductsList.length} {filteredProductsList.length === 1 ? 'product' : 'products'}
                      </span>
                      <button 
                        onClick={() => refetchProducts()}
                        className="text-slate-500 hover:text-secondary p-1 rounded-lg transition"
                        title="Refresh Products"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </h3>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                      {/* Download PDF Button */}
                      <button
                        onClick={handleDownloadProductsPDF}
                        className="w-full sm:w-auto justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xxs font-bold text-slate-700 dark:text-slate-350 transition flex items-center gap-1 cursor-pointer"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Filters & Search */}
                  <div className="flex flex-row items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/45 p-1.5 md:p-2.5 rounded-2xl">
                    <div className="flex bg-white dark:bg-slate-800 p-0.5 md:p-1 rounded-xl text-xs font-bold w-[28%] md:w-auto flex-shrink-0 border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setProductFilter('pending')}
                        className={`flex-1 md:flex-initial text-center px-1 md:px-2 py-1 md:py-1.5 rounded-lg text-xxs transition-all ${
                          productFilter === 'pending'
                            ? 'bg-secondary text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => setProductFilter('all')}
                        className={`flex-1 md:flex-initial text-center px-1 md:px-2 py-1 md:py-1.5 rounded-lg text-xxs transition-all ${
                          productFilter === 'all'
                            ? 'bg-secondary text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        All
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-grow w-[72%] md:max-w-xs">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-7 pr-2 md:pl-8 md:pr-3 py-1 md:py-1.5 rounded-xl text-xxs font-semibold focus:outline-none focus:border-secondary transition-all text-black dark:text-white"
                      />
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {filteredProductsList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No products found matching selection.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredProductsList.map(prod => (
                      <div key={prod._id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center bg-slate-50/20 dark:bg-slate-900/10 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition">
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex-shrink-0">
                            <img src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=120'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="text-xs space-y-1">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">{prod.title}</span>
                            <div className="flex flex-wrap items-center gap-2 text-slate-500">
                              <span>Price: ₹{prod.price?.toLocaleString('en-IN')}</span>
                              <span>|</span>
                              <span>SKU: <code className="font-mono text-xxs">{prod.sku}</code></span>
                              {productFilter === 'all' && (
                                <>
                                  <span>|</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold border ${
                                    prod.status === 'approved'
                                      ? 'bg-emerald-50/55 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                                      : prod.status === 'pending'
                                        ? 'bg-orange-50/55 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30'
                                        : 'bg-red-50/55 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
                                  }`}>
                                    {prod.status}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {prod.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleProductApproval(prod._id, 'approved')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition"
                                title="Approve Listing"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleProductApproval(prod._id, 'rejected')}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition"
                                title="Reject Listing"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteProduct(prod._id)}
                            className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-xl transition"
                            title="Delete Product Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  {/* Row 1: Title & Main Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
                      Platform Orders Registry
                      <span className="text-[10px] font-bold bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full">
                        {filteredAdminOrders.length} {filteredAdminOrders.length === 1 ? 'order' : 'orders'}
                      </span>
                      <button 
                        onClick={() => {
                          refetchAdminOrders();
                          refetchCustomers();
                        }}
                        className="text-slate-500 hover:text-secondary p-1 rounded-lg transition"
                        title="Refresh Orders"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </h3>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                      <button 
                        onClick={() => refetchAdminOrders()}
                        className="flex-1 sm:flex-initial justify-center text-xxs text-secondary hover:underline flex items-center gap-1 font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition"
                      >
                        <RefreshCw className="w-3 h-3" /> Refresh
                      </button>

                      {/* Download PDF Button */}
                      <button
                        onClick={handleDownloadOrdersPDF}
                        className="flex-1 sm:flex-initial justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xxs font-bold text-slate-700 dark:text-slate-350 transition flex items-center gap-1 cursor-pointer"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Filters & Search */}
                  <div className="flex flex-row items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/45 p-1.5 md:p-2.5 rounded-2xl">
                    <div className="flex items-center gap-2 w-[28%] md:w-auto flex-shrink-0">
                      <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:inline">Status:</span>
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="w-full md:w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 md:px-3 py-1 md:py-1.5 rounded-xl text-xxs font-semibold focus:outline-none focus:border-secondary transition-all text-slate-850 dark:text-white cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="placed">Placed</option>
                        <option value="processed">Approved</option>
                        <option value="shipped">Dispatched</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-grow w-[72%] md:max-w-xs">
                      <input
                        type="text"
                        placeholder="Search ID, customer..."
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-7 pr-2 md:pl-8 md:pr-3 py-1 md:py-1.5 rounded-xl text-xxs font-semibold focus:outline-none focus:border-secondary transition-all text-black dark:text-white"
                      />
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xxs text-slate-500 font-semibold">Loading orders...</p>
                  </div>
                ) : filteredAdminOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No orders found matching selection.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredAdminOrders.map(order => (
                      <div key={order._id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/10">
                        {/* Order overview row */}
                        <div className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-slate-500 flex-grow">
                            <div>
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Order ID</span>
                              <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{order.orderId}</p>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Customer</span>
                              <p className="font-semibold text-slate-700 dark:text-slate-350 mt-0.5 truncate max-w-[130px]">{order.customer?.name || 'Guest'}</p>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Date</span>
                              <p className="font-semibold text-slate-700 dark:text-slate-350 mt-0.5">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: '2-digit',
                                })}
                              </p>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Total Amount</span>
                              <p className="font-extrabold text-slate-850 dark:text-slate-100 mt-0.5">₹{order.pricing?.total?.toLocaleString() || '0'}</p>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Items count</span>
                              <p className="font-semibold text-slate-700 dark:text-slate-350 mt-0.5">{order.items?.length || 0} items</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Link
                              href={`/orders/${order.orderId}`}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-extrabold text-[10px] uppercase border transition active:scale-95 cursor-pointer ${
                                order.status === 'processed' || order.status === 'shipped' || order.status === 'delivered'
                                  ? 'bg-emerald-50 hover:bg-emerald-100/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                                  : order.status === 'pending' || order.status === 'placed'
                                    ? 'bg-orange-50 hover:bg-orange-100/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-850'
                                    : 'bg-red-50 hover:bg-red-100/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-850'
                              }`}
                              title="View Full Delivery Pipeline"
                            >
                              <span>{order.status === 'processed' ? 'Approved' : order.status}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-current" />
                            </Link>
                            
                            <button
                              onClick={() => toggleOrderExpand(order._id)}
                              className="text-secondary hover:text-cyan-600 font-bold text-xs"
                              title="Toggle Details"
                            >
                              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${expandedOrders[order._id] ? 'rotate-90' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Expandable detailed content */}
                        {expandedOrders[order._id] && (
                          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            {/* Products summary */}
                            <div>
                              <h5 className="font-extrabold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3.5">Purchased items</h5>
                              <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-850">
                                {order.items?.map((item) => (
                                  <div key={item._id} className="pt-3 first:pt-0 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50">
                                      <img 
                                        src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=120'} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                      />
                                    </div>
                                    <div className="min-w-0 flex-grow">
                                      <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.product?.title || 'Deleted Product'}</p>
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                        Qty: {item.quantity} &middot; Price: ₹{item.price?.toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="text-right font-bold text-slate-800 dark:text-slate-200">
                                      ₹{(item.price * item.quantity).toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Status Timeline */}
                            <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-5 md:pt-0 md:pl-6">
                              <h5 className="font-extrabold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3.5">Status timeline log</h5>
                              <div className="relative border-l border-slate-250 dark:border-slate-800 pl-4 space-y-4">
                                {order.statusTimeline?.map((t, idx) => (
                                  <div key={idx} className="relative">
                                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-white dark:border-slate-900 shadow-sm" />
                                    <div className="flex justify-between items-center text-[11px]">
                                      <span className="font-bold capitalize text-slate-800 dark:text-slate-250">
                                        {t.status === 'processed' ? 'Approved by Seller' : t.status}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-semibold">
                                        {new Date(t.timestamp).toLocaleString('en-IN', {
                                          dateStyle: 'short',
                                          timeStyle: 'short',
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-450 text-[10px] mt-0.5">{t.message}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Courier Assignment Section */}
                            <div className="md:col-span-2 border-t border-slate-150 dark:border-slate-800 pt-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <h5 className="font-extrabold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                  <Truck className="w-3.5 h-3.5" /> Delivery Partner Assignment
                                </h5>
                                {order.deliveryPartner ? (
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                      <Truck className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-800 dark:text-slate-250">
                                        {typeof order.deliveryPartner === 'object' ? order.deliveryPartner.name : 'Assigned Courier'}
                                      </p>
                                      {typeof order.deliveryPartner === 'object' && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                          Phone: {order.deliveryPartner.phoneNumber || 'N/A'} &middot; Status: {order.status === 'processed' ? 'Pending Pick Up' : order.status}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xxs text-slate-500 dark:text-slate-400 mt-1 italic">
                                    No delivery partner assigned to this order yet.
                                  </p>
                                )}
                              </div>

                              {/* Assignment Controls */}
                              {order.status === 'processed' && (
                                <div className="flex items-center gap-2">
                                  <select
                                    id={`assign-select-${order._id}`}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xxs font-semibold focus:outline-none focus:border-secondary transition text-slate-850 dark:text-white"
                                    defaultValue={typeof order.deliveryPartner === 'object' ? order.deliveryPartner._id : (order.deliveryPartner || '')}
                                  >
                                    <option value="" disabled>Select Delivery Partner</option>
                                    {deliveryPartners.map((partner) => (
                                      <option key={partner._id} value={partner._id}>
                                        {partner.name} ({partner.phoneNumber || 'No phone'})
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={async () => {
                                      const select = document.getElementById(`assign-select-${order._id}`);
                                      const partnerId = select?.value;
                                      if (!partnerId) {
                                        showToast('Please select a delivery partner.', 'error');
                                        return;
                                      }
                                      try {
                                        await assignDeliveryPartner({ orderId: order.orderId, deliveryPartnerId: partnerId }).unwrap();
                                        showToast('Delivery partner assigned successfully!', 'success');
                                        refetchAdminOrders();
                                      } catch (err) {
                                        showToast(err.data?.message || 'Failed to assign delivery partner.', 'error');
                                      }
                                    }}
                                    disabled={isAssigningDelivery}
                                    className="bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white text-xxs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm cursor-pointer"
                                  >
                                    {order.deliveryPartner ? 'Change Courier' : 'Assign Courier'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approvals' && (
              /* Combined pending approvals tab */
              <div className="space-y-6 animate-fade-in">
                {/* Header card with Refresh Button */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-black dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-secondary" /> Pending Approvals
                    </h3>
                    <p className="text-xxs text-slate-400 mt-1">Review pending seller profiles and catalog listings submitted for validation.</p>
                  </div>
                  <button
                    onClick={() => {
                      refetchSellers();
                      refetchProducts();
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-250 rounded-xl transition-all"
                    title="Refresh Approvals"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Pending Sellers */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-secondary" /> Pending Seller Applications
                  </h3>
                  {sellersList.filter(sel => sel.status === 'pending').length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No pending seller applications awaiting review.</p>
                  ) : (
                    <div className="space-y-4">
                      {sellersList.filter(sel => sel.status === 'pending').map(sel => (
                        <div key={sel._id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-start bg-slate-50/20 dark:bg-slate-900/10 relative pr-14 sm:pr-24">
                          <div className="text-xs space-y-1.5 flex-grow">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{sel.storeName}</span>
                              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border bg-orange-50/55 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30">
                                {sel.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1.5 sm:gap-x-4 text-slate-500 font-medium text-[11px] leading-relaxed">
                              <div>
                                <span className="text-slate-400 font-semibold mr-1">Owner Email:</span>
                                <span className="text-slate-700 dark:text-slate-350">{sel.user?.email || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-semibold mr-1">GSTIN:</span>
                                <code className="text-slate-700 dark:text-slate-350 font-mono">{sel.gstin}</code>
                              </div>
                              <div>
                                <span className="text-slate-400 font-semibold mr-1">PAN:</span>
                                <code className="text-slate-700 dark:text-slate-350 font-mono">{sel.pan}</code>
                              </div>
                            </div>

                            <div className="mt-2 text-slate-500 font-medium text-[11px] leading-relaxed">
                              <span className="text-slate-400 font-semibold mr-1">Description:</span>
                              <span className="text-slate-700 dark:text-slate-300">{sel.storeDescription || 'No description provided.'}</span>
                            </div>

                            <div className="mt-2 text-slate-500 font-medium text-[11px] leading-relaxed">
                              <span className="text-slate-400 font-semibold mr-1">Store Address:</span>
                              <span className="text-slate-700 dark:text-slate-300">
                                {sel.storeAddress 
                                  ? `${sel.storeAddress.street}, ${sel.storeAddress.city}, ${sel.storeAddress.state}, ${sel.storeAddress.country} - ${sel.storeAddress.postalCode}` 
                                  : 'N/A'}
                              </span>
                            </div>

                            <div className="mt-2 text-slate-500 font-medium text-[11px] leading-relaxed bg-white dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 max-w-xl">
                              <span className="text-slate-455 font-bold uppercase tracking-wider block text-[9px] mb-1">Bank Settlement Details</span>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <div>
                                  <span className="text-slate-400 font-semibold mr-1">Holder:</span>
                                  <span className="text-slate-700 dark:text-slate-300">{sel.bankDetails?.accountHolderName || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-semibold mr-1">Bank:</span>
                                  <span className="text-slate-700 dark:text-slate-300">{sel.bankDetails?.bankName || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-semibold mr-1">Account No:</span>
                                  <code className="text-slate-700 dark:text-slate-300 font-mono">{sel.bankDetails?.accountNumber || 'N/A'}</code>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-semibold mr-1">IFSC:</span>
                                  <code className="text-slate-700 dark:text-slate-300 font-mono">{sel.bankDetails?.ifsc || 'N/A'}</code>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="absolute top-4 right-4 flex gap-2 items-center">
                            <button
                              onClick={() => handleSellerApproval(sel._id, 'approved')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition"
                              title="Approve Store"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSellerApproval(sel._id, 'rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition"
                              title="Reject Store"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Products */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-secondary" /> Pending Product Submissions
                  </h3>
                  {pendingProducts.filter(prod => prod.status === 'pending').length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No pending products awaiting approval.</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingProducts.filter(prod => prod.status === 'pending').map(prod => (
                        <div key={prod._id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center bg-slate-50/20 dark:bg-slate-900/10">
                          <div className="flex gap-3 items-center">
                            <img src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=120'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            <div className="text-xs space-y-0.5">
                              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{prod.title}</span>
                              <p className="text-slate-500">Price: ₹{prod.price?.toLocaleString('en-IN')} | SKU: {prod.sku}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleProductApproval(prod._id, 'approved')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl"
                              title="Approve Listing"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleProductApproval(prod._id, 'rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl"
                              title="Reject Listing"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              /* Category CRUD Panel for Administrators */
              <div className="space-y-6">
                {/* Form to Create/Update Category */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-secondary" /> {editingCategory ? 'Update Category' : 'Create New Category'}
                    </span>
                    <button 
                      onClick={() => refetchCategories()}
                      className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh Categories
                    </button>
                  </h3>

                  {categorySuccess && (
                    <p className="text-xs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5 rounded-xl">
                      {categorySuccess}
                    </p>
                  )}

                  {categoryError && (
                    <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-2.5 rounded-xl">
                      {categoryError}
                    </p>
                  )}

                  <form onSubmit={handleSaveCategory} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Category Name</label>
                        <input
                          type="text"
                          value={catName}
                          onChange={e => {
                            setCatName(e.target.value);
                            if (!editingCategory) {
                              setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                            }
                          }}
                          placeholder="e.g. Laptops & Computers"
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Slug</label>
                        <input
                          type="text"
                          value={catSlug}
                          onChange={e => setCatSlug(e.target.value)}
                          placeholder="e.g. laptops"
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Description (Optional)</label>
                      <textarea
                        value={catDescription}
                        onChange={e => setCatDescription(e.target.value)}
                        placeholder="Brief description of category products..."
                        rows={3}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 bg-secondary hover:bg-cyan-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition"
                      >
                        {editingCategory ? 'Update Category' : 'Save Category'}
                      </button>
                      {editingCategory && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs shadow-sm transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Categories List Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-secondary" /> Active Product Categories
                  </h3>

                  {categoriesList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No categories created yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {categoriesList.map(cat => (
                        <div key={cat._id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center bg-slate-50/20 dark:bg-slate-900/10">
                          <div className="text-xs space-y-1">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{cat.name}</span>
                            <p className="text-slate-500">Slug: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xxs">{cat.slug}</code></p>
                            {cat.description && <p className="text-slate-400 italic">{cat.description}</p>}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(cat)}
                              className="bg-secondary hover:bg-cyan-600 text-white p-2 rounded-xl"
                              title="Edit Category"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat._id)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'carousel' && (
              /* Hero Carousel Slides Management Panel */
              <div className="space-y-6">
                {/* Form to Create/Update Slide */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-secondary" /> {editingSlide ? 'Update Hero Slide' : 'Create New Hero Slide'}
                    </span>
                    <button 
                      type="button"
                      onClick={() => refetchSlides()}
                      className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh Slides
                    </button>
                  </h3>

                  <form onSubmit={handleSaveSlide} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Tagline *</label>
                        <input
                          type="text"
                          required
                          value={slideTagline}
                          onChange={e => setSlideTagline(e.target.value)}
                          placeholder="e.g. HIGH-PERFORMANCE GADGETS"
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Primary Title *</label>
                        <input
                          type="text"
                          required
                          value={slideTitle}
                          onChange={e => setSlideTitle(e.target.value)}
                          placeholder="e.g. Power Your Setup"
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Gradient Accent Title *</label>
                        <input
                          type="text"
                          required
                          value={slideTitleAccent}
                          onChange={e => setSlideTitleAccent(e.target.value)}
                          placeholder="e.g. with Premium Tech"
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Slide Description *</label>
                      <textarea
                        required
                        value={slideDescription}
                        onChange={e => setSlideDescription(e.target.value)}
                        placeholder="Detailed slide descriptive subtitle text..."
                        rows={2}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Primary CTA Text *</label>
                        <input
                          type="text"
                          required
                          value={slideCtaText}
                          onChange={e => setSlideCtaText(e.target.value)}
                          placeholder="e.g. Shop Collection"
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Primary CTA Link *</label>
                        <input
                          type="text"
                          required
                          value={slideCtaLink}
                          onChange={e => setSlideCtaLink(e.target.value)}
                          placeholder="e.g. /products?category=laptops"
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Secondary CTA Text</label>
                        <input
                          type="text"
                          value={slideSecondaryCtaText}
                          onChange={e => setSlideSecondaryCtaText(e.target.value)}
                          placeholder="e.g. Sell on Daykart"
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Secondary CTA Link</label>
                        <input
                          type="text"
                          value={slideSecondaryCtaLink}
                          onChange={e => setSlideSecondaryCtaLink(e.target.value)}
                          placeholder="e.g. /register?role=seller"
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Category Name badge</label>
                        <input
                          type="text"
                          value={slideCategoryName}
                          onChange={e => setSlideCategoryName(e.target.value)}
                          placeholder="e.g. Premium Tech"
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Category Slug</label>
                        <select
                          value={slideCategorySlug}
                          onChange={e => setSlideCategorySlug(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        >
                          <option value="">None (Generic / Trending)</option>
                          <option value="mobiles">Mobiles</option>
                          <option value="laptops">Laptops</option>
                          <option value="fashion">Fashion</option>
                          <option value="home-kitchen">Home & Kitchen</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Banner Glow Color 1</label>
                        <select
                          value={slideGlowColor1}
                          onChange={e => setSlideGlowColor1(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        >
                          <option value="bg-cyan-500/10">Cyan Glow</option>
                          <option value="bg-blue-600/10">Blue Glow</option>
                          <option value="bg-rose-500/10">Rose Glow</option>
                          <option value="bg-emerald-600/10">Emerald Glow</option>
                          <option value="bg-purple-600/10">Purple Glow</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Banner Glow Color 2</label>
                        <select
                          value={slideGlowColor2}
                          onChange={e => setSlideGlowColor2(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        >
                          <option value="bg-orange-500/10">Orange Glow</option>
                          <option value="bg-indigo-500/10">Indigo Glow</option>
                          <option value="bg-amber-500/10">Amber Glow</option>
                          <option value="bg-teal-500/10">Teal Glow</option>
                          <option value="bg-pink-500/10">Pink Glow</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Sorting Order Index</label>
                        <input
                          type="number"
                          value={slideOrder}
                          onChange={e => setSlideOrder(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                      </div>
                    </div>

                    {/* Searchable Custom Product Multi-selector */}
                    <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                          Select Sub-Carousel Products (Max 3 - Selected: {slideSelectedProducts.length}/3)
                        </label>
                        <span className="text-[10px] font-semibold text-slate-400 italic">
                          If none selected, falls back to fetching products by category.
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Search catalog products to link..."
                        value={slideSearchQuery}
                        onChange={e => setSlideSearchQuery(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-44 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-slate-50/20 dark:bg-slate-900/10">
                        {approvedProductsRes?.data?.products
                          ?.filter(p => p.title.toLowerCase().includes(slideSearchQuery.toLowerCase()))
                          .map(p => {
                            const isSelected = slideSelectedProducts.includes(p._id);
                            return (
                              <div
                                key={p._id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSlideSelectedProducts(slideSelectedProducts.filter(id => id !== p._id));
                                  } else {
                                    if (slideSelectedProducts.length >= 3) {
                                      showToast('You can only select up to 3 products.', 'error');
                                    } else {
                                      setSlideSelectedProducts([...slideSelectedProducts, p._id]);
                                    }
                                  }
                                }}
                                className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center gap-2.5 ${
                                  isSelected
                                    ? 'border-secondary bg-secondary/10 dark:bg-secondary/5'
                                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900'
                                }`}
                              >
                                <img
                                  src={p.images?.[0] || '/placeholder.png'}
                                  alt=""
                                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{p.title}</p>
                                  <p className="text-[9px] text-slate-400">₹{p.price.toLocaleString('en-IN')}</p>
                                </div>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />}
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-secondary hover:bg-cyan-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition"
                      >
                        {editingSlide ? 'Update Hero Slide' : 'Save Hero Slide'}
                      </button>
                      {editingSlide && (
                        <button
                          type="button"
                          onClick={resetSlideForm}
                          className="bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-6 py-2.5 rounded-xl text-xs transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List of Active Slides */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-secondary" /> Active Banner Slides ({slidesRes?.data?.slides?.length || 0})
                  </h3>

                  {!slidesRes?.data?.slides || slidesRes.data.slides.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No custom hero slides configured. Homepage defaults to pre-seeded carousel.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {slidesRes.data.slides.map(slide => (
                        <div key={slide._id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap justify-between items-center gap-4 bg-slate-50/20 dark:bg-slate-900/10">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">Order: {slide.order}</span>
                              <span className="text-[10px] font-black text-secondary uppercase">{slide.tagline}</span>
                            </div>
                            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                              {slide.title} <span className="text-cyan-500">{slide.titleAccent}</span>
                            </h4>
                            <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-0.5 line-clamp-1">{slide.description}</p>
                            <div className="flex gap-4 mt-2 text-[10px] font-semibold text-slate-450">
                              <span>CTA Text: <strong className="text-slate-650 dark:text-slate-350">{slide.ctaText}</strong></span>
                              <span>Category Slug: <strong className="text-slate-650 dark:text-slate-350">{slide.categorySlug || 'None'}</strong></span>
                              <span>Products: <strong className="text-slate-650 dark:text-slate-350">{slide.products?.length || 0} selected</strong></span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSlide(slide)}
                              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-xl text-slate-600 dark:text-slate-300 transition"
                              title="Edit Slide"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSlide(slide._id)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition"
                              title="Delete Slide"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'coupons' && (
              <div className="space-y-8">
                {/* Headers and Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
                  <div className="text-center sm:text-left">
                    <h3 className="font-extrabold text-base text-black dark:text-white flex items-center justify-center sm:justify-start gap-2">
                      <Tag className="w-5 h-5 text-secondary" /> Coupon Management System
                      <button 
                        onClick={() => refetchCoupons()}
                        className="text-slate-500 hover:text-secondary p-1 rounded-lg transition"
                        title="Refresh Coupons"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </h3>
                    <p className="text-xxs text-slate-400 mt-1">Create, update, enable/disable discount coupons and manage random coupon pools.</p>
                  </div>
                  
                  {/* Tab switches */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
                    <button
                      onClick={() => { setCouponTab('standard'); resetCouponForm(); }}
                      className={`flex-1 sm:flex-initial text-center px-4 py-2 rounded-lg text-xxs font-bold transition-all ${
                        couponTab === 'standard'
                          ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Standard Coupons
                    </button>
                    <button
                      onClick={() => { setCouponTab('random'); resetCouponForm(); }}
                      className={`flex-1 sm:flex-initial text-center px-4 py-2 rounded-lg text-xxs font-bold transition-all ${
                        couponTab === 'random'
                          ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Random Coupons Pool
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Coupon Form */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                    <h4 className="font-extrabold text-sm text-black dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-secondary" />
                        {editingCoupon ? 'Edit Coupon' : couponTab === 'standard' ? 'Create Standard Coupon' : 'Create Random Coupon'}
                      </span>
                      {editingCoupon && (
                        <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-xxs px-2.5 py-1 rounded-full font-bold border border-amber-100 dark:border-amber-900/30">
                          Editing Mode
                        </span>
                      )}
                    </h4>

                    <form onSubmit={handleSaveCoupon} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Coupon Code */}
                        <div className="md:col-span-2 lg:col-span-2">
                          <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">Coupon Code</label>
                          <input
                            type="text"
                            required
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value)}
                            placeholder="e.g. SAVE20"
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none uppercase dark:text-slate-200"
                          />
                        </div>

                        {/* Discount Type */}
                        <div>
                          <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">Discount Type</label>
                          <select
                            value={couponDiscountType}
                            onChange={e => setCouponDiscountType(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none dark:text-slate-200"
                          >
                            <option value="flat">Flat Amount (₹)</option>
                            <option value="percentage">Percentage (%)</option>
                          </select>
                        </div>

                        {/* Value */}
                        <div>
                          <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">Value</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={couponDiscountValue || ''}
                            onChange={e => setCouponDiscountValue(e.target.value)}
                            placeholder="e.g. 100"
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none dark:text-slate-200"
                          />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2 lg:col-span-2">
                          <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">Description</label>
                          <textarea
                            rows={1}
                            value={couponDescription}
                            onChange={e => setCouponDescription(e.target.value)}
                            placeholder="Coupon details..."
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none dark:text-slate-200 resize-none h-[38px]"
                          />
                        </div>

                        {/* Min Order Value */}
                        <div>
                          <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">Min order value</label>
                          <input
                            type="number"
                            min={0}
                            value={couponMinOrderValue || ''}
                            onChange={e => setCouponMinOrderValue(e.target.value)}
                            placeholder="e.g. 500"
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none dark:text-slate-200"
                          />
                        </div>

                        {/* Max Discount */}
                        <div>
                          <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">Max discount</label>
                          <input
                            type="number"
                            min={0}
                            value={couponMaxDiscount || ''}
                            disabled={couponDiscountType === 'flat'}
                            onChange={e => setCouponMaxDiscount(e.target.value)}
                            placeholder="Optional"
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none dark:text-slate-200 disabled:opacity-50"
                          />
                        </div>

                        {/* Start Date */}
                        <div>
                          <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">Start Date</label>
                          <input
                            type="date"
                            required
                            value={couponStartDate}
                            onChange={e => setCouponStartDate(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none dark:text-slate-200"
                          />
                        </div>

                        {/* End Date */}
                        <div>
                          <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">End Date</label>
                          <input
                            type="date"
                            required
                            value={couponEndDate}
                            onChange={e => setCouponEndDate(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none dark:text-slate-200"
                          />
                        </div>

                        {couponTab === 'standard' ? (
                          <>
                            {/* Usage Limit */}
                            <div>
                              <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">Usage Limit</label>
                              <input
                                type="number"
                                min={1}
                                value={couponUsageLimit || ''}
                                onChange={e => setCouponUsageLimit(e.target.value)}
                                placeholder="Total limit"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none dark:text-slate-200"
                              />
                            </div>

                            {/* User Limit */}
                            <div>
                              <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">User Limit</label>
                              <input
                                type="number"
                                min={1}
                                value={couponUserLimit || ''}
                                onChange={e => setCouponUserLimit(e.target.value)}
                                placeholder="Per user limit"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none dark:text-slate-200"
                              />
                            </div>

                            {/* Valid for first N orders */}
                            <div className="md:col-span-2 lg:col-span-2">
                              <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">Valid for first N orders</label>
                              <input
                                type="number"
                                min={0}
                                value={couponFirstNOrders || ''}
                                onChange={e => setCouponFirstNOrders(e.target.value)}
                                placeholder="e.g. 1 for first order only"
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none dark:text-slate-200"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="md:col-span-2 lg:col-span-2 flex items-center">
                            <p className="text-[10px] text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 w-full text-center">
                              Surprise coupons are automatically awarded to customers after checkout.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex justify-end gap-2.5">
                        {editingCoupon && (
                          <button
                            type="button"
                            onClick={resetCouponForm}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-5 rounded-xl text-xs transition"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          className="bg-secondary hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-xl text-xs shadow-md transition"
                        >
                          {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Coupon List */}
                  <div className="space-y-4">
                    {/* List Wrapper */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                        {/* Row 1: Title & Main Action Button */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                          <h4 className="font-extrabold text-sm text-black dark:text-white flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
                            {couponTab === 'standard' ? 'Active Standard Coupons' : 'Random Coupons Pool List'}
                            <span className="text-[10px] font-bold bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full">
                              {filteredCouponsList.length} {filteredCouponsList.length === 1 ? 'coupon' : 'coupons'}
                            </span>
                          </h4>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                            {/* Download PDF Button */}
                            <button
                              onClick={handleDownloadCouponsPDF}
                              className="w-full sm:w-auto justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xxs font-bold text-slate-700 dark:text-slate-350 transition flex items-center gap-1 cursor-pointer"
                            >
                              Download PDF
                            </button>
                          </div>
                        </div>

                        {/* Row 2: Filters & Search */}
                        <div className="flex flex-row items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/45 p-1.5 md:p-2.5 rounded-2xl">
                          <div className="flex items-center gap-2 w-[28%] md:w-auto flex-shrink-0">
                            <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:inline">Status:</span>
                            <select
                              value={couponStatusFilter}
                              onChange={(e) => setCouponStatusFilter(e.target.value)}
                              className="w-full md:w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 md:px-3 py-1 md:py-1.5 rounded-xl text-xxs font-semibold focus:outline-none focus:border-secondary transition-all text-slate-850 dark:text-white cursor-pointer"
                            >
                              <option value="all">All Statuses</option>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>

                          {/* Search Input */}
                          <div className="relative flex-grow w-[72%] md:max-w-xs">
                            <input
                              type="text"
                              placeholder="Search code..."
                              value={couponSearchQuery}
                              onChange={(e) => setCouponSearchQuery(e.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-7 pr-2 md:pl-8 md:pr-3 py-1 md:py-1.5 rounded-xl text-xxs font-semibold focus:outline-none focus:border-secondary transition-all text-black dark:text-white"
                            />
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>
                      </div>

                      {filteredCouponsList.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-xs text-slate-400 italic">No coupons found matching filters.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto text-[11px] md:text-xs">
                          <table className="w-full min-w-[700px] text-left text-[11px] md:text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 text-black dark:text-white">
                                <th className="pb-3 font-extrabold uppercase tracking-wider text-[10px] md:text-xs">Code</th>
                                <th className="pb-3 font-extrabold uppercase tracking-wider text-[10px] md:text-xs">Details</th>
                                <th className="pb-3 font-extrabold uppercase tracking-wider text-[10px] md:text-xs">Dates</th>
                                {couponTab === 'standard' ? (
                                  <th className="pb-3 font-extrabold uppercase tracking-wider text-[10px] md:text-xs text-center">Limits</th>
                                ) : (
                                  <th className="pb-3 font-extrabold uppercase tracking-wider text-[10px] md:text-xs">Status / User</th>
                                )}
                                <th className="pb-3 font-extrabold uppercase tracking-wider text-[10px] md:text-xs text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredCouponsList.map((coupon) => {
                                  const isExpired = new Date(coupon.endDate) < new Date();
                                  return (
                                    <tr key={coupon._id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                      <td className="py-4 font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                                        {coupon.code}
                                        <div className="mt-1 flex gap-1">
                                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                            coupon.active && !isExpired
                                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                              : 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                          }`}>
                                            {coupon.active && !isExpired ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-4">
                                        <div className="font-bold text-slate-800 dark:text-slate-300">
                                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">Min Order: ₹{coupon.minOrderValue}</div>
                                        {coupon.firstNOrders > 0 && (
                                          <div className="text-[10px] text-secondary mt-0.5 font-bold">1st {coupon.firstNOrders} orders</div>
                                        )}
                                      </td>
                                      <td className="py-4 text-[10px] text-slate-400">
                                        <div>S: {new Date(coupon.startDate).toLocaleDateString('en-IN')}</div>
                                        <div>E: {new Date(coupon.endDate).toLocaleDateString('en-IN')}</div>
                                      </td>
                                      {couponTab === 'standard' ? (
                                        <td className="py-4 text-center">
                                          <div className="font-bold text-slate-700 dark:text-slate-300">
                                            {coupon.usedCount} / {coupon.usageLimit || '∞'}
                                          </div>
                                          <div className="text-[10px] text-slate-400">Per User: {coupon.userLimit}</div>
                                        </td>
                                      ) : (
                                        <td className="py-4">
                                          {coupon.assignedTo ? (
                                            <div>
                                              <span className="bg-green-100 dark:bg-green-955 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                                Assigned
                                              </span>
                                              <div className="text-[9px] font-mono text-slate-400 mt-1 truncate max-w-[120px]" title={coupon.assignedTo}>
                                                ID: {coupon.assignedTo}
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="bg-blue-100 dark:bg-blue-955 text-blue-600 dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                              In Pool (Available)
                                            </span>
                                          )}
                                        </td>
                                      )}
                                      <td className="py-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                          {/* Toggle Status Slider */}
                                          <button
                                            type="button"
                                            onClick={() => handleToggleCouponActive(coupon)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                                              coupon.active ? 'bg-secondary' : 'bg-slate-200 dark:bg-slate-700'
                                            }`}
                                          >
                                            <span
                                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                coupon.active ? 'translate-x-4' : 'translate-x-0'
                                              }`}
                                            />
                                          </button>
                                          <button
                                            onClick={() => handleEditCoupon(coupon)}
                                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-1.5 rounded-lg text-slate-600 dark:text-slate-300 transition"
                                            title="Edit Coupon"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                                            className="bg-red-100 hover:bg-red-200 dark:bg-red-955/40 dark:hover:bg-red-900/60 p-1.5 rounded-lg text-red-600 dark:text-red-400 transition"
                                            title="Delete Coupon"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-black dark:text-white flex items-center gap-2">
                      <Truck className="w-5 h-5 text-secondary" /> Manage Shipping Charges
                    </h3>
                    <p className="text-xxs text-slate-400 mt-1">Configure shipping rates dynamically based on the customer's cart value (subtotal).</p>
                  </div>
                  <button 
                    onClick={() => {
                      refetchShippingRules();
                      refetchCodCharge();
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-250 rounded-xl transition"
                    title="Refresh Shipping Settings"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* COD Handling Fee Config */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                  <h4 className="font-extrabold text-sm text-black dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 font-bold">
                    <Wallet className="w-4.5 h-4.5 text-secondary" /> Cash on Delivery (COD) Handling Charge
                  </h4>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="w-full sm:max-w-xs">
                      <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">COD Additional Fee (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={codChargeInput}
                        onChange={(e) => setCodChargeInput(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs text-slate-850 dark:text-white font-semibold focus:outline-none focus:border-secondary transition-all"
                        placeholder="e.g. 50"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isUpdatingCodCharge}
                      onClick={async () => {
                        try {
                          await updateCodCharge(codChargeInput).unwrap();
                          showToast('Cash on Delivery handling charge updated successfully!', 'success');
                          refetchCodCharge();
                        } catch (err) {
                          showToast(err.data?.message || 'Failed to update COD charge.', 'error');
                        }
                      }}
                      className="bg-secondary hover:bg-cyan-600 text-white font-bold py-3.5 px-6 rounded-xl text-xs shadow-md active:scale-98 transition disabled:opacity-50"
                    >
                      {isUpdatingCodCharge ? 'Saving...' : 'Save COD Charge'}
                    </button>
                  </div>
                </div>

                {/* Form & List */}
                <div className="space-y-8">
                  {/* Form */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                    <h4 className="font-extrabold text-sm text-black dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-secondary" />
                        {editingShippingRule ? 'Edit Shipping Rule' : 'Create Shipping Rule'}
                      </span>
                      {editingShippingRule && (
                        <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-xxs px-2.5 py-1 rounded-full font-bold border border-amber-100 dark:border-amber-900/30">
                          Editing Mode
                        </span>
                      )}
                    </h4>

                    <form onSubmit={handleSaveShippingRule} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Min Cart Value */}
                        <div>
                          <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">Min Cart Value (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={minCartValue}
                            onChange={(e) => setMinCartValue(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs text-slate-850 dark:text-white font-semibold focus:outline-none focus:border-secondary transition-all"
                            required
                          />
                        </div>

                        {/* Max Cart Value */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider">Max Cart Value (₹)</label>
                            <label className="flex items-center gap-1 text-xxs text-slate-500 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={noUpperLimit}
                                onChange={(e) => {
                                  setNoUpperLimit(e.target.checked);
                                  if (e.target.checked) setMaxCartValue('');
                                }}
                                className="rounded text-secondary focus:ring-secondary cursor-pointer"
                              />
                              No Upper Limit
                            </label>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={maxCartValue}
                            onChange={(e) => setMaxCartValue(e.target.value)}
                            disabled={noUpperLimit}
                            placeholder={noUpperLimit ? 'Infinity' : 'e.g., 299'}
                            className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs text-slate-850 dark:text-white font-semibold focus:outline-none focus:border-secondary transition-all ${
                              noUpperLimit ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            required={!noUpperLimit}
                          />
                        </div>

                        {/* Shipping Charge */}
                        <div>
                          <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">Shipping Charge (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={shippingCharge}
                            onChange={(e) => setShippingCharge(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs text-slate-850 dark:text-white font-semibold focus:outline-none focus:border-secondary transition-all"
                            required
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3 justify-end pt-2">
                        {editingShippingRule && (
                          <button
                            type="button"
                            onClick={resetShippingForm}
                            className="px-5 py-3 rounded-xl text-xxs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          className="bg-secondary hover:bg-cyan-600 text-white px-6 py-3 rounded-xl text-xxs font-bold shadow-md transition"
                        >
                          {editingShippingRule ? 'Update Rule' : 'Add Rule'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Rules Table */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                      {/* Row 1: Title & Main Action Button */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                        <h4 className="font-extrabold text-sm text-black dark:text-white flex items-center justify-center sm:justify-start gap-1.5 text-center sm:text-left">
                          <ClipboardList className="w-4 h-4 text-secondary" /> Active Shipping Rules
                          <span className="text-[10px] font-bold bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full">
                            {filteredShippingRules.length} {filteredShippingRules.length === 1 ? 'rule' : 'rules'}
                          </span>
                        </h4>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                          {/* Download PDF Button */}
                          <button
                            onClick={handleDownloadShippingPDF}
                            className="w-full sm:w-auto justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xxs font-bold text-slate-700 dark:text-slate-350 transition flex items-center gap-1 cursor-pointer"
                          >
                            Download PDF
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Filters & Search */}
                      <div className="flex flex-row items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/45 p-1.5 md:p-2.5 rounded-2xl">
                        <div className="flex items-center gap-2 w-[28%] md:w-auto flex-shrink-0">
                          <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:inline">Rates Policy:</span>
                          <span className="text-xxs font-semibold text-slate-650 dark:text-slate-300 w-full md:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 md:px-3 py-1 md:py-1.5 rounded-xl text-center md:text-left md:border-0 md:bg-transparent md:p-0">
                            <span className="hidden md:inline">Standard Tiered Pricing</span>
                            <span className="md:hidden">Standard Tiered</span>
                          </span>
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-grow w-[72%] md:max-w-xs">
                          <input
                            type="text"
                            placeholder="Search rules..."
                            value={shippingSearchQuery}
                            onChange={(e) => setShippingSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-7 pr-2 md:pl-8 md:pr-3 py-1 md:py-1.5 rounded-xl text-xxs font-semibold focus:outline-none focus:border-secondary transition-all text-black dark:text-white"
                          />
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {filteredShippingRules.length === 0 ? (
                      <div className="text-center py-10">
                        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto opacity-50 mb-3" />
                        <p className="text-xs font-semibold text-slate-500">No shipping rules found matching filters.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px] text-left text-[11px] md:text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                              <th className="pb-3 text-[10px] md:text-xs font-extrabold text-black dark:text-white uppercase tracking-wider">Cart Value Range (₹)</th>
                              <th className="pb-3 text-[10px] md:text-xs font-extrabold text-black dark:text-white uppercase tracking-wider">Shipping Charge (₹)</th>
                              <th className="pb-3 text-[10px] md:text-xs font-extrabold text-black dark:text-white uppercase tracking-wider text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredShippingRules.map((rule) => {
                              const isNoLimit = rule.maxCartValue === null || rule.maxCartValue === undefined;
                              return (
                                <tr key={rule._id} className="border-b border-slate-50 dark:border-slate-855 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                                  <td className="py-3.5 text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {isNoLimit ? `₹${rule.minCartValue} and above` : `₹${rule.minCartValue} - ₹${rule.maxCartValue}`}
                                  </td>
                                  <td className="py-3.5 text-[11px] md:text-xs font-semibold">
                                    {rule.charge === 0 ? (
                                      <span className="text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full text-[10px] md:text-xxs border border-emerald-100 dark:border-emerald-900/30">FREE SHIPPING</span>
                                    ) : (
                                      <span className="text-slate-700 dark:text-slate-350">₹{rule.charge}</span>
                                    )}
                                  </td>
                                  <td className="py-3.5 text-right">
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={() => handleEditShippingRule(rule)}
                                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-1.5 rounded-lg text-slate-600 dark:text-slate-300 transition"
                                        title="Edit Rule"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteShippingRule(rule._id)}
                                        className="bg-red-100 hover:bg-red-200 dark:bg-red-955/40 dark:hover:bg-red-900/60 p-1.5 rounded-lg text-red-600 dark:text-red-400 transition"
                                        title="Delete Rule"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'wallet' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                <h3 className="font-extrabold text-base text-black dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-secondary" /> Admin Wallet
                  </span>
                  <button 
                    onClick={() => refetchWallet()}
                    className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Balance Card */}
                  <div className="md:col-span-1 bg-gradient-to-br from-secondary to-cyan-600 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between min-h-[160px]">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Admin Balance</p>
                      <h4 className="text-3xl font-black mt-2">₹{wallet.balance}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold opacity-90 bg-white/10 px-3 py-1.5 rounded-xl w-max">
                      <ShieldCheck className="w-3.5 h-3.5" /> Secured Administrator Wallet
                    </div>
                  </div>

                  {/* Info Card */}
                  <div className="md:col-span-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl p-6 flex flex-col justify-center space-y-2">
                    <h5 className="font-bold text-xs text-black dark:text-white">Platform Operational Ledger</h5>
                    <p className="text-xxs text-slate-450">
                      As a platform administrator, you can monitor transactions, audit logs, and test client referral rewards using this local wallet.
                    </p>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="space-y-4 pt-4">
                  <h4 className="font-extrabold text-sm text-black dark:text-white">
                    Admin Wallet Logs
                  </h4>

                  {walletLoading ? (
                    <p className="text-xxs text-slate-455 animate-pulse">Loading admin wallet ledger...</p>
                  ) : !wallet.transactions || wallet.transactions.length === 0 ? (
                    <p className="text-xxs text-slate-455 italic py-4">No wallet transactions recorded.</p>
                  ) : (
                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-black dark:text-white">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wallet.transactions.map((tx, idx) => {
                            const isCredit = tx.type === 'credit';
                            return (
                              <tr key={idx} className="border-b border-slate-50 dark:border-slate-850 text-xxs text-slate-650 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-all">
                                <td className="px-4 py-3 text-[10px] text-slate-450">
                                  {new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-4 py-3 font-semibold">{tx.description}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    isCredit 
                                      ? 'bg-emerald-55/10 text-emerald-500 border border-emerald-100/20' 
                                      : 'bg-red-50/10 text-red-500 border border-red-100/20'
                                  }`}>
                                    {tx.type.toUpperCase()}
                                  </span>
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${isCredit ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {isCredit ? '+' : '-'}₹{tx.amount}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'referrals' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-black dark:text-white flex items-center gap-2">
                      <Gift className="w-5 h-5 text-secondary" /> Referral System Configuration
                    </h3>
                    <p className="text-xxs text-slate-400 mt-1">Configure customer referral bonuses and audit successful platform invites.</p>
                  </div>
                  <button 
                    onClick={() => {
                      refetchReferralSettings();
                      refetchAdminReferrals();
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-250 rounded-xl transition"
                    title="Refresh Referral Settings"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Form & List */}
                <div className="space-y-8">
                  {/* Settings Form */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                    <h4 className="font-extrabold text-sm text-black dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-secondary" /> Reward Settings
                    </h4>

                    <form onSubmit={handleSaveReferralSettings} className="space-y-4">
                      <div className="max-w-xs">
                        <label className="block text-xs font-extrabold text-black dark:text-white uppercase tracking-wider mb-1">Referral Reward Credit (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={referralRewardAmount}
                          onChange={(e) => setReferralRewardAmount(Number(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs text-slate-850 dark:text-white font-semibold focus:outline-none focus:border-secondary transition-all"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={updatingReward}
                        className="w-full sm:w-auto bg-secondary hover:bg-cyan-600 text-white px-6 py-3 rounded-xl text-xxs font-bold shadow-md transition disabled:opacity-50"
                      >
                        {updatingReward ? 'Updating...' : 'Save Settings'}
                      </button>
                    </form>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                      {/* Row 1: Title & Main Action Button */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                        <h4 className="font-extrabold text-sm text-black dark:text-white flex items-center justify-center sm:justify-start gap-1.5 text-center sm:text-left">
                          <ClipboardList className="w-4 h-4 text-secondary" /> Referral Audit Trail
                          <span className="text-[10px] font-bold bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full">
                            {filteredReferrals.length} {filteredReferrals.length === 1 ? 'invite' : 'invites'}
                          </span>
                        </h4>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                          {/* Download PDF Button */}
                          <button
                            onClick={handleDownloadReferralsPDF}
                            className="w-full sm:w-auto justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xxs font-bold text-slate-700 dark:text-slate-350 transition flex items-center gap-1 cursor-pointer"
                          >
                            Download PDF
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Filters & Search */}
                      <div className="flex flex-row items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/45 p-1.5 md:p-2.5 rounded-2xl">
                        <div className="flex flex-wrap items-center gap-1.5 w-[38%] md:w-auto flex-shrink-0">
                          <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:inline">Filters:</span>
                          <select
                            value={referralDateFilter}
                            onChange={(e) => setReferralDateFilter(e.target.value)}
                            className="flex-1 md:flex-initial bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 md:px-2 py-1 md:py-1.5 rounded-xl text-xxs font-semibold focus:outline-none focus:border-secondary transition-all text-slate-850 dark:text-white cursor-pointer"
                          >
                            <option value="all">All Time</option>
                            <option value="7days">7 Days</option>
                            <option value="30days">30 Days</option>
                          </select>

                          <select
                            value={referralSortOrder}
                            onChange={(e) => setReferralSortOrder(e.target.value)}
                            className="flex-1 md:flex-initial bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 md:px-2 py-1 md:py-1.5 rounded-xl text-xxs font-semibold focus:outline-none focus:border-secondary transition-all text-slate-850 dark:text-white cursor-pointer"
                          >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                          </select>
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-grow w-[62%] md:max-w-xs">
                          <input
                            type="text"
                            placeholder="Search..."
                            value={referralSearch}
                            onChange={(e) => setReferralSearch(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-7 pr-2 md:pl-8 md:pr-3 py-1 md:py-1.5 rounded-xl text-xxs font-semibold focus:outline-none focus:border-secondary transition-all text-black dark:text-white"
                          />
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {!adminReferralsRes?.data?.referrals || adminReferralsRes.data.referrals.length === 0 ? (
                      <p className="text-xxs text-slate-455 italic py-4">No platform referral signups recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left text-[11px] md:text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                              <th className="pb-3 text-[10px] md:text-xs font-extrabold text-black dark:text-white uppercase tracking-wider">Date</th>
                              <th className="pb-3 text-[10px] md:text-xs font-extrabold text-black dark:text-white uppercase tracking-wider">Referred User</th>
                              <th className="pb-3 text-[10px] md:text-xs font-extrabold text-black dark:text-white uppercase tracking-wider">Referred Email</th>
                              <th className="pb-3 text-[10px] md:text-xs font-extrabold text-black dark:text-white uppercase tracking-wider">Referrer</th>
                              <th className="pb-3 text-[10px] md:text-xs font-extrabold text-black dark:text-white uppercase tracking-wider">Referrer Code</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredReferrals.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="py-8 text-center text-xxs text-slate-450 italic">
                                  No matching referrals found.
                                </td>
                              </tr>
                            ) : (
                              filteredReferrals.map((ref) => (
                                <tr key={ref._id} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                                  <td className="py-3.5 text-[11px] md:text-xs text-slate-500">
                                    {new Date(ref.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="py-3.5 text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {ref.name}
                                  </td>
                                  <td className="py-3.5 text-[11px] md:text-xs text-slate-600 dark:text-slate-400">
                                    {ref.email}
                                  </td>
                                  <td className="py-3.5 text-[11px] md:text-xs font-semibold text-slate-700 dark:text-slate-350">
                                    {ref.referredBy?.name || 'N/A'}
                                  </td>
                                  <td className="py-3.5 text-[11px] md:text-xs font-mono text-secondary">
                                    {ref.referredBy?.referralCode || 'N/A'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              /* Support Tickets (Tokens Raised) Section */
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-secondary" /> Tokens Raised (Support)
                        <button 
                          onClick={() => refetchTickets()}
                          className="text-slate-500 hover:text-secondary p-1 rounded-lg transition"
                          title="Refresh Tickets"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </h3>
                      <p className="text-xxs text-slate-400 mt-1">Manage and resolve customer support queries on the platform.</p>
                    </div>

                    {/* Filter and Search actions */}
                    <div className="flex flex-wrap items-center gap-2 md:self-end">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search subject/email..."
                          value={ticketSearchQuery}
                          onChange={(e) => setTicketSearchQuery(e.target.value)}
                          className="bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-8 pr-3 py-1.5 rounded-xl text-xxs outline-none transition dark:text-slate-200 w-44"
                        />
                        <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-400" />
                      </div>

                      <select
                        value={ticketPriorityFilter}
                        onChange={(e) => setTicketPriorityFilter(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-2.5 py-1.5 rounded-xl text-xxs outline-none transition dark:text-slate-200 cursor-pointer"
                      >
                        <option value="all">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  {/* Tabs: Pending vs Resolved */}
                  <div className="flex border-b border-slate-100 dark:border-slate-800 mb-2 gap-5 text-xxs font-bold select-none mt-4">
                    <button
                      onClick={() => {
                        setTicketStatusFilter('pending');
                        setSelectedTicketId(null);
                      }}
                      className={`pb-2 px-1 transition relative ${ticketStatusFilter === 'pending' ? 'text-secondary font-black border-b-2 border-secondary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'}`}
                    >
                      Pending Tickets ({tickets.filter(t => t.status !== 'resolved').length})
                    </button>
                    <button
                      onClick={() => {
                        setTicketStatusFilter('resolved');
                        setSelectedTicketId(null);
                      }}
                      className={`pb-2 px-1 transition relative ${ticketStatusFilter === 'resolved' ? 'text-secondary font-black border-b-2 border-secondary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'}`}
                    >
                      Resolved Tickets ({tickets.filter(t => t.status === 'resolved').length})
                    </button>
                  </div>

                  {ticketsLoading ? (
                    <div className="space-y-4 py-8">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                        <MessageSquare className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-450 italic">No tickets found matching the search or filters.</p>
                    </div>
                  ) : (
                    /* Split Layout */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-start">
                      {/* Left: Tickets List */}
                      <div className={`space-y-3 lg:block ${selectedTicketId ? 'hidden' : 'block'}`}>
                        <div className="max-h-[600px] overflow-y-auto pr-1 space-y-2.5">
                          {filteredTickets.map((ticket) => {
                            const isSelected = selectedTicketId === ticket._id;
                            const statusStyles = {
                              open: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40',
                              in_progress: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40',
                              resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40',
                            };
                            const priorityStyles = {
                              low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                              medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400',
                              high: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400',
                            };

                            return (
                              <div
                                key={ticket._id}
                                onClick={() => setSelectedTicketId(ticket._id)}
                                className={`p-4 border rounded-2xl cursor-pointer transition flex flex-col gap-2 ${
                                  isSelected
                                    ? 'bg-slate-50 dark:bg-slate-850 border-secondary shadow-sm'
                                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-850/40 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${statusStyles[ticket.status] || 'bg-slate-100 text-slate-600'}`}>
                                    {ticket.status === 'in_progress' ? 'in progress' : ticket.status}
                                  </span>
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${priorityStyles[ticket.priority] || 'bg-slate-100'}`}>
                                    {ticket.priority} prio
                                  </span>
                                </div>

                                <div className="min-w-0">
                                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">
                                    {ticket.subject}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    From: {ticket.customer?.name || ticket.customer?.email || 'Unknown User'}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2 text-[9px] text-slate-400 font-bold">
                                  <span>{ticket.messages?.length || 0} messages</span>
                                  <span>
                                    {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Ticket Conversation Details */}
                      <div className={`lg:col-span-2 bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 min-h-[500px] flex flex-col ${
                        selectedTicketId ? 'block' : 'hidden lg:flex justify-center items-center'
                      }`}>
                        {selectedTicket ? (
                          <div className="flex-1 flex flex-col h-full">
                            {/* Selected Ticket Header */}
                            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-col sm:flex-row justify-between gap-3">
                              <div>
                                {selectedTicketId && (
                                  <button
                                    onClick={() => setSelectedTicketId(null)}
                                    className="lg:hidden text-xxs font-bold text-secondary hover:underline flex items-center gap-1 mb-2"
                                  >
                                    ← Back to Tickets List
                                  </button>
                                )}
                                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                  {selectedTicket.subject}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                  <span className="font-bold">{selectedTicket.customer?.name} ({selectedTicket.customer?.email})</span>
                                  <span>•</span>
                                  <span>Opened {new Date(selectedTicket.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}</span>
                                  {selectedTicket.order?.orderId && (
                                    <>
                                      <span>•</span>
                                      <span className="text-secondary font-bold">Order ID: #{selectedTicket.order.orderId}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {selectedTicket.status !== 'resolved' ? (
                                <button
                                  onClick={handleResolveTicket}
                                  disabled={isResolving}
                                  className="sm:self-start bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xxs shadow-sm transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isResolving ? 'Resolving...' : 'Mark Resolved'}</span>
                                </button>
                              ) : (
                                <span className="sm:self-start bg-emerald-100 text-emerald-800 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40 font-bold px-3 py-1.5 rounded-xl text-xxs flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Resolved</span>
                                </span>
                              )}
                            </div>

                            {/* Conversation Messages */}
                            <div className="flex-1 overflow-y-auto max-h-[360px] my-4 space-y-3.5 pr-1 py-2">
                              {selectedTicket.messages?.map((msg) => {
                                const isCustomer = msg.sender?.toString() === selectedTicket.customer?._id?.toString() || msg.sender?.toString() === selectedTicket.customer?.toString();
                                const isSystem = msg.text.startsWith('---');

                                if (isSystem) {
                                  return (
                                    <div key={msg._id} className="text-center my-2 text-[10px] text-slate-400 italic bg-slate-100 dark:bg-slate-900 py-1.5 px-3 rounded-full max-w-xs mx-auto border border-slate-200/50 dark:border-slate-800/50">
                                      {msg.text.replace(/---/g, '').trim()}
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={msg._id}
                                    className={`flex flex-col max-w-[85%] ${
                                      isCustomer ? 'mr-auto items-start' : 'ml-auto items-end'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold text-slate-400">
                                      <span>{isCustomer ? (selectedTicket.customer?.name || 'Customer') : 'Support Admin'}</span>
                                      <span>•</span>
                                      <span>
                                        {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                    <div
                                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                        isCustomer
                                          ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-800'
                                          : 'bg-cyan-50 dark:bg-cyan-950/30 text-slate-800 dark:text-slate-200 rounded-tr-none border border-cyan-100 dark:border-cyan-900/40 shadow-sm'
                                      }`}
                                    >
                                      {msg.text}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Reply Form */}
                            {selectedTicket.status !== 'resolved' ? (
                              <form onSubmit={handleSendTicketReply} className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-3 flex gap-2">
                                <textarea
                                  value={ticketReplyText}
                                  onChange={(e) => setTicketReplyText(e.target.value)}
                                  placeholder="Type your official support response here..."
                                  rows={2}
                                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-secondary p-3 rounded-xl text-xs outline-none transition resize-none dark:text-slate-200"
                                />
                                <button
                                  type="submit"
                                  disabled={isReplying || !ticketReplyText.trim()}
                                  className="bg-secondary hover:bg-cyan-600 text-white font-bold px-4 rounded-xl text-xs transition shadow-md active:scale-98 disabled:opacity-40 flex items-center justify-center"
                                >
                                  {isReplying ? 'Sending...' : 'Reply'}
                                </button>
                              </form>
                            ) : (
                              <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-3 text-center text-[10px] text-slate-400 italic">
                                This support ticket is closed and resolved.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic p-8 text-center">
                            <MessageSquare className="w-10 h-10 mb-2.5 text-slate-350" />
                            <p className="text-xxs">Select a support ticket from the list to view its conversation thread and send a response.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-secondary" /> Delivery Partner Operations
                    </h3>
                    <p className="text-xxs text-slate-400 mt-1">Manage delivery partners, view live shipment tracks, and assign packets.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        refetchDeliveryApplications?.();
                        refetchDeliveryPartners?.();
                        refetchAdminOrders?.();
                      }}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-755 text-slate-750 dark:text-slate-250 font-bold px-3 py-1.5 rounded-xl text-xxs transition flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh Data
                    </button>
                  </div>
                </div>

                {/* Sub-tab Selectors */}
                <div className="flex gap-4 border-b border-slate-100 dark:border-slate-850 pb-2 text-xs font-bold">
                  <button
                    onClick={() => setDeliverySubTab('partners')}
                    className={`pb-1.5 transition ${deliverySubTab === 'partners' ? 'text-secondary border-b-2 border-secondary font-black' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Approved Partners Registry ({deliveryPartnersList.length})
                  </button>
                  <button
                    onClick={() => setDeliverySubTab('applications')}
                    className={`pb-1.5 transition ${deliverySubTab === 'applications' ? 'text-secondary border-b-2 border-secondary font-black' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Onboarding Applications ({deliveryApplicationsRes?.data?.users?.length || 0})
                  </button>
                  <button
                    onClick={() => setDeliverySubTab('shipments')}
                    className={`pb-1.5 transition ${deliverySubTab === 'shipments' ? 'text-secondary border-b-2 border-secondary font-black' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Shipment Status Tracker ({adminOrdersList.length})
                  </button>
                </div>

                {/* Sub-tab 1: Registry & Analytics */}
                {deliverySubTab === 'partners' && (
                  <div className="space-y-4">
                    {deliveryPartnersList.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                        <Truck className="w-8 h-8 text-slate-450 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 italic">No approved delivery partners registered yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {deliveryPartnersList.map((partner) => {
                          // Compute stats
                          const partnerOrders = adminOrdersList.filter(o => 
                            o.deliveryPartner?._id === partner._id || 
                            o.deliveryPartner === partner._id
                          );
                          const assignedCount = partnerOrders.length;
                          const deliveredCount = partnerOrders.filter(o => o.status === 'delivered').length;
                          const activeCount = partnerOrders.filter(o => 
                            ['processed', 'shipped', 'out_for_delivery'].includes(o.status)
                          ).length;
                          const earnings = deliveredCount * 50; // ₹50 per delivery
                          
                          // Count matching support tickets
                          const partnerComplaints = tickets.filter(t => 
                            t.subject?.toLowerCase().includes(partner.name.toLowerCase()) ||
                            t.customer?.email?.toLowerCase() === partner.email.toLowerCase() ||
                            t.messages?.some(m => m.text?.toLowerCase().includes(partner.name.toLowerCase()))
                          ).length;

                          return (
                            <div key={partner._id} className="bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-xxs">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">{partner.name}</h4>
                                  <p className="text-xxs text-slate-400 mt-0.5">{partner.email}</p>
                                  <p className="text-xxs text-slate-400 font-mono mt-0.5">{partner.phoneNumber || 'No phone number'}</p>
                                </div>
                                <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                                  Approved
                                </span>
                              </div>

                              <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                                  <div className="text-xs font-black text-slate-850 dark:text-slate-100">{assignedCount}</div>
                                  <div className="text-[8px] text-slate-450 font-bold uppercase mt-0.5">Assigned</div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-450">{deliveredCount}</div>
                                  <div className="text-[8px] text-slate-455 font-bold uppercase mt-0.5">Delivered</div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                                  <div className="text-xs font-black text-indigo-650 dark:text-indigo-400">{activeCount}</div>
                                  <div className="text-[8px] text-slate-455 font-bold uppercase mt-0.5">In Transit</div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                                  <div className="text-xs font-black text-red-500 dark:text-red-400">{partnerComplaints}</div>
                                  <div className="text-[8px] text-slate-455 font-bold uppercase mt-0.5">Complaints</div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-150/40 dark:border-slate-800 pt-3 text-xxs font-bold text-slate-650 dark:text-slate-350">
                                <span>Estimated Earnings:</span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">₹{earnings}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 2: Onboarding Applications */}
                {deliverySubTab === 'applications' && (
                  <div className="space-y-4">
                    {deliveryApplicationsLoading ? (
                      <div className="space-y-4">
                        {Array(3).fill(0).map((_, idx) => (
                          <div key={idx} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                        ))}
                      </div>
                    ) : !deliveryApplicationsRes?.data?.users || deliveryApplicationsRes.data.users.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                        <Truck className="w-8 h-8 text-slate-455 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 italic">No pending onboarding applications found.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                              <th className="py-3 px-4">Courier Name</th>
                              <th className="py-3 px-4">Email Address</th>
                              <th className="py-3 px-4">Phone Number</th>
                              <th className="py-3 px-4">Applied Date</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deliveryApplicationsRes.data.users.map((appUser) => (
                              <tr key={appUser._id} className="border-b border-slate-55 dark:border-slate-850 hover:bg-slate-50/20 dark:hover:bg-slate-900/10">
                                <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{appUser.name}</td>
                                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{appUser.email}</td>
                                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{appUser.phoneNumber || 'N/A'}</td>
                                <td className="py-3.5 px-4 text-slate-400">{new Date(appUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                                  <button
                                    onClick={() => handleApproveDelivery(appUser._id, 'approved')}
                                    disabled={isApprovingDelivery}
                                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold px-3 py-1.5 rounded-xl transition active:scale-95 shadow-xs"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleApproveDelivery(appUser._id, 'rejected')}
                                    disabled={isApprovingDelivery}
                                    className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-extrabold px-3 py-1.5 rounded-xl transition active:scale-95 shadow-xs"
                                  >
                                    Reject
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 3: Shipments Tracker & Partner Assignment */}
                {deliverySubTab === 'shipments' && (
                  <div className="space-y-4">
                    {adminOrdersList.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                        <ShoppingBag className="w-8 h-8 text-slate-455 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 italic">No orders found on the platform.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[9px] font-bold">
                              <th className="py-3 px-4">Order ID</th>
                              <th className="py-3 px-4">Customer</th>
                              <th className="py-3 px-4">Items</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Assigned Partner</th>
                              <th className="py-3 px-4 text-right">Assign partner</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminOrdersList.map((order) => {
                              const currentPartnerId = order.deliveryPartner?._id || order.deliveryPartner || '';
                              
                              const statusStyles = {
                                placed: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400',
                                processed: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
                                shipped: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400',
                                out_for_delivery: 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
                                delivered: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450',
                                cancelled: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455',
                              };

                              return (
                                <tr key={order._id} className="border-b border-slate-55 dark:border-slate-850 hover:bg-slate-50/20 dark:hover:bg-slate-900/10">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {order.orderId || order._id}
                                    <div className="text-[8px] text-slate-400 font-normal">
                                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-slate-800 dark:text-slate-200">{order.shippingAddress?.name || 'N/A'}</div>
                                    <div className="text-[9px] text-slate-450">{order.shippingAddress?.city} ({order.shippingAddress?.postalCode})</div>
                                  </td>
                                  <td className="py-3 px-4 max-w-[150px] truncate font-bold text-slate-700 dark:text-slate-300">
                                    {order.items?.[0]?.product?.name || 'Package'}
                                    {order.items?.length > 1 && ` (+${order.items.length - 1} items)`}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border dark:border-transparent ${statusStyles[order.status] || 'bg-slate-100 text-slate-650'}`}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                                    {order.deliveryPartner ? (
                                      <div>
                                        <div className="text-[10px] text-slate-800 dark:text-slate-200">{order.deliveryPartner.name || 'Unknown'}</div>
                                        <div className="text-[8px] text-slate-400 font-mono">{order.deliveryPartner.phoneNumber}</div>
                                      </div>
                                    ) : (
                                      <span className="text-[8px] text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                                        Unassigned
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <select
                                      value={currentPartnerId}
                                      onChange={(e) => handleAssignPartner(order.orderId || order._id, e.target.value)}
                                      disabled={isAssigningDelivery || order.status === 'delivered' || order.status === 'cancelled'}
                                      className="bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-2 py-1 rounded-xl text-xxs font-bold text-slate-700 dark:text-slate-200 cursor-pointer outline-none transition disabled:opacity-50"
                                    >
                                      <option value="">Select Partner</option>
                                      {deliveryPartnersList.map((partner) => (
                                        <option key={partner._id} value={partner._id}>
                                          {partner.name}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-secondary" /> Cart Value & Checkout Constraints
                  </span>
                  <button 
                    type="button"
                    onClick={() => refetchCartLimits()}
                    className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Settings
                  </button>
                </h3>

                <p className="text-xxs text-slate-400 -mt-2">
                  Configure global limits on cart values. These thresholds are dynamically checked on the user checkout page and during backend order validation.
                </p>

                {settingsSuccess && (
                  <p className="text-xs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5 rounded-xl">
                    {settingsSuccess}
                  </p>
                )}

                {settingsError && (
                  <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/40 p-2.5 rounded-xl">
                    {settingsError}
                  </p>
                )}

                <form onSubmit={handleSaveCartSettings} className="space-y-6 max-w-lg">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                        Minimum Cart Value for Checkout (₹)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          required
                          value={minCheckoutValInput}
                          onChange={(e) => setMinCheckoutValInput(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 focus:border-secondary pl-4 pr-10 py-3 rounded-2xl text-xs font-semibold outline-none transition text-black dark:text-white"
                          placeholder="e.g. 0 (disabled)"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        The minimum order subtotal required before a customer is allowed to proceed to checkout. Set to 0 to disable this minimum.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                        Minimum Cart Value for Cash on Delivery (₹)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          required
                          value={minCodValInput}
                          onChange={(e) => setMinCodValInput(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 focus:border-secondary pl-4 pr-10 py-3 rounded-2xl text-xs font-semibold outline-none transition text-black dark:text-white"
                          placeholder="e.g. 500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        The minimum order subtotal required to enable the Cash on Delivery (COD) payment method. Subtotals below this amount will require online payments.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                        Default Delivery Agent (Fallback)
                      </label>
                      <select
                        value={defaultAgentInput}
                        onChange={(e) => setDefaultAgentInput(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 focus:border-secondary px-4 py-3 rounded-2xl text-xs font-semibold outline-none transition text-black dark:text-white"
                      >
                        <option value="">-- No Default Agent Selected --</option>
                        {deliveryPartnersList.map((partner) => (
                          <option key={partner._id} value={partner._id}>
                            {partner.name} ({partner.email})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Select the default courier partner. If no action (courier assignment) is taken on an order within 2 hours of placement, the system will automatically assign this agent.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingCartLimits}
                    className="bg-secondary hover:bg-cyan-600 disabled:opacity-50 text-white font-bold text-xs py-3 px-6 rounded-2xl transition shadow-md hover:shadow-lg active:scale-98"
                  >
                    {isUpdatingCartLimits ? 'Saving...' : 'Save Settings'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'profile' && (
              /* Profile Details edit panel inside Admin Dashboard */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-5 h-5 text-secondary" /> Personal Details
                  </span>
                  <button 
                    type="button"
                    onClick={() => refetchProfile()}
                    className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Profile
                  </button>
                </h3>

                {profileSuccess && (
                  <p className="text-xs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5 rounded-xl">
                    Profile updated successfully!
                  </p>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none opacity-60 dark:text-slate-200"
                      />
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Phone Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-secondary hover:bg-cyan-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition"
                  >
                    Update Profile
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
      />
      <Footer />
    </div>
  );
}
