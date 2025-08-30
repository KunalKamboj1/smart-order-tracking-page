import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Frame,
  TopBar,
  Navigation,
  Toast,
  Loading,
  ContextualSaveBar,
  Badge,
  Text,
  InlineStack,
  BlockStack,
} from '@shopify/polaris';
import {
  HomeMajor,
  SettingsMajor,
  AnalyticsMajor,
  OrdersMajor,
  CustomersMajor,
  NotificationMajor,
  QuestionMarkMajor,
  LogOutMinor,
  ProfileMinor,
  StoreMajor,
} from '@shopify/polaris-icons';

const AppFrame = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const [userMenuActive, setUserMenuActive] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Mock user data
  const user = {
    name: 'John Smith',
    email: 'john@example.com',
    store: 'My Awesome Store',
    avatar: null,
    plan: 'Basic',
    notifications: 3,
  };

  // Navigation items
  const navigationItems = [
    {
      url: '/',
      label: 'Dashboard',
      icon: HomeMajor,
      selected: location.pathname === '/',
      badge: null,
    },
    {
      url: '/orders',
      label: 'Orders',
      icon: OrdersMajor,
      selected: location.pathname === '/orders',
      badge: '24',
    },
    {
      url: '/analytics',
      label: 'Analytics',
      icon: AnalyticsMajor,
      selected: location.pathname === '/analytics',
      badge: null,
    },
    {
      url: '/settings',
      label: 'Settings',
      icon: SettingsMajor,
      selected: location.pathname === '/settings',
      badge: null,
    },
  ];

  // Secondary navigation items
  const secondaryNavigationItems = [
    {
      url: '/customers',
      label: 'Customers',
      icon: CustomersMajor,
      selected: location.pathname === '/customers',
    },
    {
      url: '/help',
      label: 'Help & Support',
      icon: QuestionMarkMajor,
      selected: location.pathname === '/help',
    },
  ];

  // User menu actions
  const userMenuActions = [
    {
      items: [
        {
          content: 'View Profile',
          icon: ProfileMinor,
          onAction: () => {
            navigate('/profile');
            setUserMenuActive(false);
          },
        },
        {
          content: 'Store Settings',
          icon: StoreMajor,
          onAction: () => {
            navigate('/store-settings');
            setUserMenuActive(false);
          },
        },
        {
          content: 'Notifications',
          icon: NotificationMajor,
          badge: user.notifications > 0 ? user.notifications.toString() : null,
          onAction: () => {
            navigate('/notifications');
            setUserMenuActive(false);
          },
        },
      ],
    },
    {
      items: [
        {
          content: 'Log out',
          icon: LogOutMinor,
          onAction: () => {
            // In a real app, this would handle logout
            showToast('Logged out successfully');
            setUserMenuActive(false);
          },
        },
      ],
    },
  ];

  // Event handlers
  const toggleMobileNavigationActive = useCallback(
    () => setMobileNavigationActive((mobileNavigationActive) => !mobileNavigationActive),
    []
  );

  const toggleUserMenuActive = useCallback(
    () => setUserMenuActive((userMenuActive) => !userMenuActive),
    []
  );

  const toggleSearchActive = useCallback(
    () => setSearchActive((searchActive) => !searchActive),
    []
  );

  const handleSearchChange = useCallback((value) => {
    setSearchValue(value);
  }, []);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setToastActive(true);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchValue.trim()) {
      // In a real app, this would perform search
      showToast(`Searching for: ${searchValue}`);
      setSearchActive(false);
      setSearchValue('');
    }
  }, [searchValue, showToast]);

  const handleNavigationClick = useCallback((item) => {
    navigate(item.url);
    setMobileNavigationActive(false);
  }, [navigate]);

  const handleSave = useCallback(() => {
    setIsLoading(true);
    // Simulate save operation
    setTimeout(() => {
      setIsLoading(false);
      setIsDirty(false);
      showToast('Changes saved successfully');
    }, 1000);
  }, [showToast]);

  const handleDiscard = useCallback(() => {
    setIsDirty(false);
    showToast('Changes discarded');
  }, [showToast]);

  // Top bar markup
  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      userMenu={
        <TopBar.UserMenu
          actions={userMenuActions}
          name={user.name}
          detail={user.store}
          initials={user.name.split(' ').map(n => n[0]).join('')}
          open={userMenuActive}
          onToggle={toggleUserMenuActive}
          avatar={user.avatar}
        />
      }
      searchResultsVisible={searchActive}
      searchField={
        <TopBar.SearchField
          onChange={handleSearchChange}
          value={searchValue}
          placeholder="Search orders, customers, settings..."
          showFocusBorder
          onFocus={toggleSearchActive}
          onBlur={() => setSearchActive(false)}
          onSubmit={handleSearchSubmit}
        />
      }
      onNavigationToggle={toggleMobileNavigationActive}
      onSearchResultsDismiss={() => setSearchActive(false)}
    />
  );

  // Navigation markup
  const navigationMarkup = (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={navigationItems.map(item => ({
          ...item,
          onClick: () => handleNavigationClick(item),
          badge: item.badge ? (
            <Badge status={item.url === '/orders' ? 'attention' : 'info'}>
              {item.badge}
            </Badge>
          ) : null,
        }))}
      />
      
      <Navigation.Section
        title="More"
        items={secondaryNavigationItems.map(item => ({
          ...item,
          onClick: () => handleNavigationClick(item),
        }))}
        separator
      />
      
      <Navigation.Section
        title="Quick Links"
        items={[
          {
            label: 'View Store',
            icon: StoreMajor,
            url: 'https://your-store.myshopify.com',
            external: true,
          },
          {
            label: 'Shopify Admin',
            icon: HomeMajor,
            url: '/admin',
            external: true,
          },
        ]}
        separator
      />
    </Navigation>
  );

  // Contextual save bar (shown when there are unsaved changes)
  const contextualSaveBarMarkup = isDirty ? (
    <ContextualSaveBar
      message="Unsaved changes"
      saveAction={{
        content: 'Save',
        onAction: handleSave,
        loading: isLoading,
      }}
      discardAction={{
        content: 'Discard',
        onAction: handleDiscard,
      }}
    />
  ) : null;

  // Toast markup
  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      onDismiss={() => setToastActive(false)}
      duration={4000}
    />
  ) : null;

  // Loading markup
  const loadingMarkup = isLoading ? <Loading /> : null;

  // App info section for navigation
  const appInfoMarkup = (
    <div style={{ padding: '16px', borderTop: '1px solid #e1e3e5' }}>
      <BlockStack gap="200">
        <InlineStack align="space-between">
          <Text variant="bodyMd" fontWeight="semibold">Smart Order Tracking</Text>
          <Badge>v1.0.0</Badge>
        </InlineStack>
        <InlineStack align="space-between">
          <Text variant="bodySm" color="subdued">Plan: {user.plan}</Text>
          <Text variant="bodySm" color="subdued">Store: {user.store}</Text>
        </InlineStack>
      </BlockStack>
    </div>
  );

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigationActive}
      skipToContentTarget="main-content"
    >
      {contextualSaveBarMarkup}
      {loadingMarkup}
      
      <div id="main-content" style={{ minHeight: '100vh' }}>
        {children}
      </div>
      
      {toastMarkup}
      
      {/* Footer info for desktop navigation */}
      <div style={{ display: 'none' }}>
        {appInfoMarkup}
      </div>
    </Frame>
  );
};

export default AppFrame;