'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { LayoutDashboard, Users, ShoppingBag, ShieldCheck, CheckCircle2, XCircle, User, Mail, Phone, AlertTriangle, Store, Plus, Trash2, Edit, FolderOpen, ClipboardList, RefreshCw, ChevronRight, Sliders, Tag, Gift, Percent, Calendar, Truck } from 'lucide-react';
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

  const { data: statsRes, isLoading: statsLoading } = useGetAdminStatsQuery(undefined, { skip: activeTab !== 'overview' || !isAdmin || !mounted });
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
    { skip: activeTab !== 'orders' || !isAdmin || !mounted }
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">Admin Control Panel</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Side Tabs */}
          <div className="space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'overview'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" /> Overview Metrics
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'approvals'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4.5 h-4.5" /> Pending Approvals
            </button>
            <button
              onClick={() => setActiveTab('sellers')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'sellers'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4.5 h-4.5" /> Moderate Sellers
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'products'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ShoppingBag className="w-4.5 h-4.5" /> Moderate Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'orders'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ClipboardList className="w-4.5 h-4.5" /> Customer Orders
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'categories'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <FolderOpen className="w-4.5 h-4.5" /> Manage Categories
            </button>
            <button
              onClick={() => setActiveTab('carousel')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'carousel'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4.5 h-4.5" /> Manage Carousel
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'coupons'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Tag className="w-4.5 h-4.5" /> Manage Coupons
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'shipping'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Truck className="w-4.5 h-4.5" /> Manage Shipping
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
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
              <div className="space-y-8">
                {statsLoading ? (
                  <div className="text-sm text-slate-400 animate-pulse">Loading Platform Analytics...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Sales</p>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">₹{stats.totalSales.toLocaleString('en-IN')}</h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Active Customers</p>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.totalCustomers}</h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Registered Sellers</p>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.totalSellers}</h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.totalOrders}</h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Seller Rejections</p>
                      <h2 className="text-xl font-extrabold text-rose-600 mt-2">{stats.rejectedBySellersCount || 0}</h2>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sellers' && (
              /* Sellers list and approvals */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                    Seller Registrations
                  </h3>
                  <button 
                    onClick={() => setShowAddSellerForm(!showAddSellerForm)}
                    className="bg-secondary text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-cyan-600 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Seller
                  </button>
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

                {sellersList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No registered sellers found.</p>
                ) : (
                  <div className="space-y-4">
                    {sellersList.map(sel => (
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
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 gap-3">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                    Moderate Product Catalog
                  </h3>
                  
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                    <button
                      onClick={() => setProductFilter('pending')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        productFilter === 'pending'
                          ? 'bg-secondary text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Pending Review
                    </button>
                    <button
                      onClick={() => setProductFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        productFilter === 'all'
                          ? 'bg-secondary text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      All Products
                    </button>
                  </div>
                </div>

                {pendingProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No products found matching selection.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingProducts.map(prod => (
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
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                    Platform Orders Registry
                  </h3>
                  <button 
                    onClick={() => refetchAdminOrders()}
                    className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>

                {ordersLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xxs text-slate-500 font-semibold">Loading orders...</p>
                  </div>
                ) : adminOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No orders found on the platform.</p>
                ) : (
                  <div className="space-y-4">
                    {adminOrders.map(order => (
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
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              order.status === 'processed' || order.status === 'shipped' || order.status === 'delivered'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                                : order.status === 'pending' || order.status === 'placed'
                                  ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600'
                                  : 'bg-red-50 dark:bg-red-950/40 text-red-600'
                            }`}>
                              {order.status === 'processed' ? 'Approved' : order.status}
                            </span>
                            
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
              <div className="space-y-6">
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
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <Store className="w-5 h-5 text-secondary" /> {editingCategory ? 'Update Category' : 'Create New Category'}
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
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-secondary" /> {editingSlide ? 'Update Hero Slide' : 'Create New Hero Slide'}
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
                  <div>
                    <h3 className="font-extrabold text-base text-black dark:text-white flex items-center gap-2">
                      <Tag className="w-5 h-5 text-secondary" /> Coupon Management System
                    </h3>
                    <p className="text-xxs text-slate-400 mt-1">Create, update, enable/disable discount coupons and manage random coupon pools.</p>
                  </div>
                  
                  {/* Tab switches */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => { setCouponTab('standard'); resetCouponForm(); }}
                      className={`px-4 py-2 rounded-lg text-xxs font-bold transition-all ${
                        couponTab === 'standard'
                          ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Standard Coupons
                    </button>
                    <button
                      onClick={() => { setCouponTab('random'); resetCouponForm(); }}
                      className={`px-4 py-2 rounded-lg text-xxs font-bold transition-all ${
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
                      <h4 className="font-extrabold text-sm text-black dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span>{couponTab === 'standard' ? 'Active Standard Coupons' : 'Random Coupons Pool List'}</span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xxs px-2.5 py-1 rounded-full font-bold">
                          Total: {
                            couponsRes?.data?.coupons?.filter(c => couponTab === 'standard' ? !c.isRandomPool : c.isRandomPool).length || 0
                          }
                        </span>
                      </h4>

                      {!couponsRes?.data?.coupons || couponsRes.data.coupons.filter(c => couponTab === 'standard' ? !c.isRandomPool : c.isRandomPool).length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-xs text-slate-400 italic">No coupons found in this category.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto text-xxs sm:text-xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 text-black dark:text-white">
                                <th className="pb-3 font-extrabold uppercase tracking-wider text-xxs">Code</th>
                                <th className="pb-3 font-extrabold uppercase tracking-wider text-xxs">Details</th>
                                <th className="pb-3 font-extrabold uppercase tracking-wider text-xxs">Dates</th>
                                {couponTab === 'standard' ? (
                                  <th className="pb-3 font-extrabold uppercase tracking-wider text-xxs text-center">Limits</th>
                                ) : (
                                  <th className="pb-3 font-extrabold uppercase tracking-wider text-xxs">Status / User</th>
                                )}
                                <th className="pb-3 font-extrabold uppercase tracking-wider text-xxs text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {couponsRes.data.coupons
                                .filter(c => couponTab === 'standard' ? !c.isRandomPool : c.isRandomPool)
                                .map((coupon) => {
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
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-base text-black dark:text-white flex items-center gap-2">
                      <Truck className="w-5 h-5 text-secondary" /> Manage Shipping Charges
                    </h3>
                    <p className="text-xxs text-slate-400 mt-1">Configure shipping rates dynamically based on the customer's cart value (subtotal).</p>
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
                    <h4 className="font-extrabold text-sm text-black dark:text-white mb-4 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-secondary" /> Active Shipping Rules
                    </h4>

                    {!shippingRulesRes?.data?.shippingRules || shippingRulesRes.data.shippingRules.length === 0 ? (
                      <div className="text-center py-10">
                        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto opacity-50 mb-3" />
                        <p className="text-xs font-semibold text-slate-500">No shipping rules found. Set default rules above.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                              <th className="pb-3 text-xxs font-extrabold text-slate-400 uppercase tracking-wider">Cart Value Range (₹)</th>
                              <th className="pb-3 text-xxs font-extrabold text-slate-400 uppercase tracking-wider">Shipping Charge (₹)</th>
                              <th className="pb-3 text-xxs font-extrabold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shippingRulesRes.data.shippingRules.map((rule) => {
                              const isNoLimit = rule.maxCartValue === null || rule.maxCartValue === undefined;
                              return (
                                <tr key={rule._id} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                                  <td className="py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {isNoLimit ? `₹${rule.minCartValue} and above` : `₹${rule.minCartValue} - ₹${rule.maxCartValue}`}
                                  </td>
                                  <td className="py-3.5 text-xs font-semibold">
                                    {rule.charge === 0 ? (
                                      <span className="text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full text-xxs border border-emerald-100 dark:border-emerald-900/30">FREE SHIPPING</span>
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

            {activeTab === 'profile' && (
              /* Profile Details edit panel inside Admin Dashboard */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-secondary" /> Personal Details
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
