import React, { useState } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  DataTable,
  Badge,
  InlineStack,
  BlockStack,
  Icon,
  Banner,
  Spinner,
  EmptyState,
} from '@shopify/polaris';
import {
  OrdersMajor,
  CircleTickMajor,
  CircleAlertMajor,
  ViewMajor,
} from '@shopify/polaris-icons';
import { useQuery } from 'react-query';
import * as api from '../utils/api';
import TrackingDetails from '../components/TrackingDetails';

const { apiClient, apiEndpoints } = api;

const Dashboard = () => {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);

  // Fetch real orders from API
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery(
    'orders',
    async () => {
      const response = await apiClient.get(apiEndpoints.orders.list());
      return response.orders || [];
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      retry: 3,
    }
  );

  // Calculate stats from real data
  const stats = {
    totalOrders: orders.length || 0,
    trackedOrders: orders.filter(order => order.trackingNumber).length || 0,
    deliveredOrders: orders.filter(order => order.fulfillmentStatus === 'fulfilled').length || 0,
    pendingOrders: orders.filter(order => order.fulfillmentStatus === 'pending' || !order.fulfillmentStatus).length || 0,
  };

  // Use real orders or fallback to empty array
  const recentOrders = orders.slice(0, 5).map(order => ({
    id: order.id,
    orderNumber: order.name || `#${order.orderNumber}`,
    customer: order.customer?.firstName && order.customer?.lastName 
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : order.customer?.email || 'Unknown Customer',
    status: order.fulfillmentStatus === 'fulfilled' ? 'Delivered' 
          : order.fulfillmentStatus === 'partial' ? 'In Transit'
          : order.fulfillmentStatus === 'restocked' ? 'Processing'
          : order.trackingNumber ? 'Shipped' : 'Processing',
    trackingNumber: order.trackingNumber || 'Not Available',
    carrier: order.trackingCompany || 'N/A',
    estimatedDelivery: order.estimatedDelivery || 'TBD',
    value: order.totalPrice ? `$${parseFloat(order.totalPrice).toFixed(2)}` : '$0.00',
  }));

  const getStatusBadge = (status) => {
    const statusMap = {
      'Delivered': { status: 'success', children: 'Delivered' },
      'In Transit': { status: 'info', children: 'In Transit' },
      'Shipped': { status: 'attention', children: 'Shipped' },
      'Processing': { status: 'warning', children: 'Processing' },
    };
    return <Badge {...statusMap[status]} />;
  };

  const tableRows = recentOrders.map((order) => [
    order.orderNumber,
    order.customer,
    getStatusBadge(order.status),
    order.trackingNumber !== 'Not Available' ? (
      <Button
        size="slim"
        onClick={() => setSelectedOrderForTracking(orders.find(o => o.id === order.id))}
      >
        {order.trackingNumber}
      </Button>
    ) : order.trackingNumber,
    order.carrier,
    order.estimatedDelivery,
    order.value,
  ]);

  // Handle loading and error states
  if (ordersLoading) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spinner size="large" />
                <Text variant="bodyMd" as="p" color="subdued">
                  Loading dashboard data...
                </Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (ordersError) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Banner status="critical">
              <Text variant="bodyMd" as="p">
                Failed to load dashboard data. Please check your connection and try again.
              </Text>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const StatCard = ({ title, value, icon, trend }) => (
    <Card>
      <div style={{padding: '16px'}}>
        <InlineStack align="space-between">
          <BlockStack gap="200">
            <Text variant="bodyMd" color="subdued">
              {title}
            </Text>
            <Text variant="headingLg" as="p">{value}</Text>
            {trend && (
              <Text variant="bodyMd" color={trend > 0 ? 'success' : 'critical'}>
                {trend > 0 ? '+' : ''}{trend}% from last month
              </Text>
            )}
          </BlockStack>
          <Icon source={icon} color="base" />
        </InlineStack>
      </div>
    </Card>
  );

  return (
    <Page
      title="Dashboard"
      subtitle="Overview of your order tracking performance"
      primaryAction={{
        content: 'View All Orders',
        icon: ViewMajor,
      }}
    >
      <Layout>
        <Layout.Section>
          <Banner
            title="Welcome to Smart Order Tracking!"
            status="info"
            action={{
              content: 'Complete Setup',
              url: '/onboarding',
            }}
          >
            <p>
              Track your orders efficiently and provide customers with real-time updates.
              Complete your setup to unlock all features.
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Layout>
            <Layout.Section oneQuarter>
              <StatCard
                title="Total Orders"
                value={stats.totalOrders.toLocaleString()}
                icon={OrdersMajor}
                trend={0}
              />
            </Layout.Section>
            <Layout.Section oneQuarter>
              <StatCard
                title="Tracked Orders"
                value={stats.trackedOrders.toLocaleString()}
                icon={CircleTickMajor}
                trend={0}
              />
            </Layout.Section>
            <Layout.Section oneQuarter>
              <StatCard
                title="Delivered"
                value={stats.deliveredOrders.toLocaleString()}
                icon={CircleTickMajor}
                trend={0}
              />
            </Layout.Section>
            <Layout.Section oneQuarter>
              <StatCard
                title="Pending"
                value={stats.pendingOrders.toLocaleString()}
                icon={CircleAlertMajor}
                trend={0}
              />
            </Layout.Section>
          </Layout>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{padding: '16px'}}>
              <Text variant="headingLg" as="h2">Recent Orders</Text>
            </div>
            {recentOrders.length > 0 ? (
              <>
                <DataTable
                  columnContentTypes={[
                    'text',
                    'text',
                    'text',
                    'text',
                    'text',
                    'text',
                    'numeric',
                  ]}
                  headings={[
                    'Order',
                    'Customer',
                    'Status',
                    'Tracking Number',
                    'Carrier',
                    'Est. Delivery',
                    'Value',
                  ]}
                  rows={tableRows}
                  selectable
                  selectedRows={selectedOrders}
                  onSelectionChange={setSelectedOrders}
                />
                <div style={{padding: '16px'}}>
                  <InlineStack align="center">
                    <Button>View All Orders</Button>
                  </InlineStack>
                </div>
              </>
            ) : (
              <div style={{padding: '16px'}}>
                <EmptyState
                  heading="No orders found"
                  action={{
                    content: 'Refresh',
                    onAction: () => window.location.reload(),
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text variant="bodyMd" as="p">
                    Your store doesn't have any orders yet, or there might be a connection issue.
                  </Text>
                </EmptyState>
              </div>
            )}
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card title="Quick Actions">
            <div style={{padding: '16px'}}>
              <BlockStack gap="200">
                <Button fullWidth>Import Orders</Button>
                <Button fullWidth>Export Data</Button>
                <Button fullWidth>Update Tracking</Button>
                <Button fullWidth>Send Notifications</Button>
              </BlockStack>
            </div>
          </Card>

          <Card title="Tracking Performance">
            <div style={{padding: '16px'}}>
              <BlockStack gap="300">
                <BlockStack gap="100">
                  <Text variant="bodyMd" color="subdued">
                    Tracking Rate
                  </Text>
                  <Text variant="headingMd" as="p">
                    {stats.totalOrders > 0 ? Math.round((stats.trackedOrders / stats.totalOrders) * 100) : 0}%
                  </Text>
                </BlockStack>
                <BlockStack gap="100">
                  <Text variant="bodyMd" color="subdued">
                    Delivery Rate
                  </Text>
                  <Text variant="headingMd" as="p">
                    {stats.trackedOrders > 0 ? Math.round((stats.deliveredOrders / stats.trackedOrders) * 100) : 0}%
                  </Text>
                </BlockStack>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
      
      {selectedOrderForTracking && (
        <TrackingDetails
          order={selectedOrderForTracking}
          onClose={() => setSelectedOrderForTracking(null)}
        />
      )}
    </Page>
  );
};

export default Dashboard;