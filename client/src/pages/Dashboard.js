import React, { useState, useEffect } from 'react';
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

const Dashboard = () => {
  const [selectedOrders, setSelectedOrders] = useState([]);

  // Mock data for demonstration - in real app, this would come from API
  const mockStats = {
    totalOrders: 1247,
    trackedOrders: 1089,
    deliveredOrders: 956,
    pendingOrders: 133,
  };

  const mockRecentOrders = [
    {
      id: '1001',
      orderNumber: '#SO-1001',
      customer: 'John Smith',
      status: 'In Transit',
      trackingNumber: 'TRK123456789',
      carrier: 'FedEx',
      estimatedDelivery: '2024-01-25',
      value: '$89.99',
    },
    {
      id: '1002',
      orderNumber: '#SO-1002',
      customer: 'Sarah Johnson',
      status: 'Delivered',
      trackingNumber: 'TRK987654321',
      carrier: 'UPS',
      estimatedDelivery: '2024-01-23',
      value: '$156.50',
    },
    {
      id: '1003',
      orderNumber: '#SO-1003',
      customer: 'Mike Davis',
      status: 'Processing',
      trackingNumber: 'TRK456789123',
      carrier: 'DHL',
      estimatedDelivery: '2024-01-28',
      value: '$234.75',
    },
    {
      id: '1004',
      orderNumber: '#SO-1004',
      customer: 'Emily Wilson',
      status: 'Shipped',
      trackingNumber: 'TRK789123456',
      carrier: 'USPS',
      estimatedDelivery: '2024-01-26',
      value: '$67.25',
    },
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      'Delivered': { status: 'success', children: 'Delivered' },
      'In Transit': { status: 'info', children: 'In Transit' },
      'Shipped': { status: 'attention', children: 'Shipped' },
      'Processing': { status: 'warning', children: 'Processing' },
    };
    return <Badge {...statusMap[status]} />;
  };

  const tableRows = mockRecentOrders.map((order) => [
    order.orderNumber,
    order.customer,
    getStatusBadge(order.status),
    order.trackingNumber,
    order.carrier,
    order.estimatedDelivery,
    order.value,
  ]);

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
                value={mockStats.totalOrders.toLocaleString()}
                icon={OrdersMajor}
                trend={12}
              />
            </Layout.Section>
            <Layout.Section oneQuarter>
              <StatCard
                title="Tracked Orders"
                value={mockStats.trackedOrders.toLocaleString()}
                icon={CircleTickMajor}
                trend={8}
              />
            </Layout.Section>
            <Layout.Section oneQuarter>
              <StatCard
                title="Delivered"
                value={mockStats.deliveredOrders.toLocaleString()}
                icon={CircleTickMajor}
                trend={15}
              />
            </Layout.Section>
            <Layout.Section oneQuarter>
              <StatCard
                title="Pending"
                value={mockStats.pendingOrders.toLocaleString()}
                icon={CircleAlertMajor}
                trend={-3}
              />
            </Layout.Section>
          </Layout>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{padding: '16px'}}>
              <Text variant="headingLg" as="h2">Recent Orders</Text>
            </div>
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
                    {Math.round((mockStats.trackedOrders / mockStats.totalOrders) * 100)}%
                  </Text>
                </BlockStack>
                <BlockStack gap="100">
                  <Text variant="bodyMd" color="subdued">
                    Delivery Rate
                  </Text>
                  <Text variant="headingMd" as="p">
                    {Math.round((mockStats.deliveredOrders / mockStats.trackedOrders) * 100)}%
                  </Text>
                </BlockStack>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Dashboard;