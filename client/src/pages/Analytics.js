import React, { useState, useCallback, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  DataTable,
  Select,
  Button,
  Banner,
  ProgressBar,
  InlineStack,
  BlockStack,
  Divider,
  List,
  Icon,
} from '@shopify/polaris';
import {
  AnalyticsMajor,
  OrdersMajor,
  ViewMajor,
  MobileMajor,
  DesktopMajor,
  CalendarMajor,
} from '@shopify/polaris-icons';

const Analytics = () => {
  const [dateRange, setDateRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real analytics data from backend
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/analytics?days=${dateRange}`);
      const data = await response.json();
      
      if (data.success) {
        // Use the raw analytics data from backend without transformations
          setAnalyticsData(data.analytics);
        
        setAnalyticsData(transformedData);
      } else {
        setError(data.error || 'Failed to fetch analytics data');
        // Fallback to mock data structure with zeros
        setAnalyticsData({
          overview: {
            totalLookups: 0,
            successfulLookups: 0,
            uniqueVisitors: 0,
            pageViews: 0,
            averageSessionDuration: '0:00',
            bounceRate: 0,
            conversionRate: 0,
            mobileTraffic: 0,
          },
          trends: { dailyLookups: [] },
          topCarriers: [],
          orderStatuses: [],
          deviceBreakdown: [],
          topCountries: []
        });
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
      // Set empty data structure
      setAnalyticsData({
        overview: {
          totalLookups: 0,
          successfulLookups: 0,
          uniqueVisitors: 0,
          pageViews: 0,
          averageSessionDuration: '0:00',
          bounceRate: 0,
          conversionRate: 0,
          mobileTraffic: 0,
        },
        trends: { dailyLookups: [] },
        topCarriers: [],
        orderStatuses: [],
        deviceBreakdown: [],
        topCountries: []
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);



  const dateRangeOptions = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'Last 12 months', value: '365' },
  ];

  const metricOptions = [
    { label: 'Overview', value: 'overview' },
    { label: 'Traffic Sources', value: 'traffic' },
    { label: 'Order Status', value: 'orders' },
    { label: 'Geographic', value: 'geographic' },
  ];

  const handleExportData = useCallback(() => {
    // In a real app, this would export analytics data
    console.log('Exporting analytics data...');
  }, []);

  const handleDateRangeChange = useCallback((newRange) => {
    setDateRange(newRange);
    // fetchAnalytics will be called automatically via useEffect
  }, []);

  // Show loading state
  if (loading) {
    return (
      <Page title="Analytics">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Text variant="headingMd">Loading analytics data...</Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Show error state
  if (error) {
    return (
      <Page title="Analytics">
        <Layout>
          <Layout.Section>
            <Banner title="Error loading analytics" status="critical">
              <p>{error}</p>
              <Button onClick={fetchAnalytics}>Retry</Button>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Show empty state if no data
  if (!analyticsData) {
    return (
      <Page title="Analytics">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Text variant="headingMd">No analytics data available</Text>
                <Button onClick={fetchAnalytics}>Refresh</Button>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const renderOverviewCards = () => (
    <Layout>
      <Layout.Section oneThird>
        <Card sectioned>
          <BlockStack gap="200">
            <InlineStack align="center" gap="200">
              <Icon source={AnalyticsMajor} color="base" />
              <Text variant="headingMd">Total Lookups</Text>
            </InlineStack>
            <Text variant="headingXl" as="p">{analyticsData.overview.totalLookups.toLocaleString()}</Text>
            <InlineStack gap="200">
              <Badge status="success">+12.5%</Badge>
              <Text variant="bodySm" color="subdued">vs last period</Text>
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>

      <Layout.Section oneThird>
        <Card sectioned>
          <BlockStack gap="200">
            <InlineStack align="center" gap="200">
              <Icon source={OrdersMajor} color="base" />
              <Text variant="headingMd">Success Rate</Text>
            </InlineStack>
            <Text variant="headingXl" as="p">{analyticsData.overview.conversionRate}%</Text>
            <InlineStack gap="200">
              <ProgressBar progress={analyticsData.overview.conversionRate} size="small" />
              <Text variant="bodySm" color="subdued">of all lookups</Text>
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>

      <Layout.Section oneThird>
        <Card sectioned>
          <BlockStack gap="200">
            <InlineStack align="center" gap="200">
              <Icon source={ViewMajor} color="base" />
              <Text variant="headingMd">Page Views</Text>
            </InlineStack>
            <Text variant="headingXl" as="p">{analyticsData.overview.pageViews.toLocaleString()}</Text>
            <InlineStack gap="200">
              <Badge status="success">+8.3%</Badge>
              <Text variant="bodySm" color="subdued">vs last period</Text>
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>

      <Layout.Section oneHalf>
        <Card sectioned>
          <BlockStack gap="300">
            <Text variant="headingMd">Page Performance</Text>
            <InlineStack distribution="fillEvenly">
              <BlockStack gap="300">
                <InlineStack align="center">
                  <Icon source={ViewMajor} color="base" />
                  <Text variant="bodyMd">Page Views</Text>
                </InlineStack>
                <Text variant="headingLg">{analyticsData.overview.pageViews.toLocaleString()}</Text>
              </BlockStack>
              <BlockStack gap="300">
                <InlineStack align="center">
                  <Icon source={CalendarMajor} color="base" />
                  <Text variant="bodyMd">Avg. Session</Text>
                </InlineStack>
                <Text variant="headingLg">{analyticsData.overview.averageSessionDuration}</Text>
              </BlockStack>
            </InlineStack>
            <Divider />
            <InlineStack distribution="fillEvenly">
              <BlockStack gap="300">
                <Text variant="bodyMd">Bounce Rate</Text>
                <Text variant="headingMd">{analyticsData.overview.bounceRate}%</Text>
                <ProgressBar progress={analyticsData.overview.bounceRate} size="small" color="critical" />
              </BlockStack>
              <BlockStack gap="300">
                <Text variant="bodyMd">Mobile Traffic</Text>
                <Text variant="headingMd">{analyticsData.overview.mobileTraffic}%</Text>
                <ProgressBar progress={analyticsData.overview.mobileTraffic} size="small" color="success" />
              </BlockStack>
            </InlineStack>
           </BlockStack>
        </Card>
      </Layout.Section>

      <Layout.Section oneHalf>
        <Card title="Device Breakdown" sectioned>
          <BlockStack gap="300">
            {analyticsData.deviceBreakdown.map((device, index) => (
              <InlineStack key={index} align="space-between">
                <InlineStack align="center" gap="200">
                  <Icon 
                    source={device.device === 'Mobile' ? MobileMajor : DesktopMajor} 
                    color="base" 
                  />
                  <Text variant="bodyMd">{device.device}</Text>
                </InlineStack>
                <Text variant="bodyMd">{device.visits.toLocaleString()}</Text>
                <BlockStack gap="100">
                  <Text variant="bodySm" color="subdued">{device.percentage}%</Text>
                  <ProgressBar progress={device.percentage} size="small" />
                </BlockStack>
              </InlineStack>
            ))}
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderCarrierAnalytics = () => (
    <Layout>
      <Layout.Section oneHalf>
        <Card title="Top Shipping Carriers" sectioned>
          <BlockStack gap="300">
            {analyticsData.topCarriers.map((carrier, index) => (
              <InlineStack key={index} align="space-between">
                <Text variant="bodyMd">{carrier.carrier}</Text>
                <Text variant="bodyMd">{carrier.orders} orders</Text>
                <BlockStack gap="100">
                  <Text variant="bodySm" color="subdued">{carrier.percentage}%</Text>
                  <ProgressBar progress={carrier.percentage} size="small" />
                </BlockStack>
              </InlineStack>
            ))}
          </BlockStack>
        </Card>
      </Layout.Section>

      <Layout.Section oneHalf>
        <Card title="Order Status Distribution" sectioned>
          <BlockStack gap="300">
            {analyticsData.orderStatuses.map((status, index) => {
              let badgeStatus = 'info';
              if (status.status === 'Delivered') badgeStatus = 'success';
              if (status.status === 'Exception') badgeStatus = 'critical';
              if (status.status === 'In Transit') badgeStatus = 'attention';
              
              return (
                <InlineStack key={index} align="space-between">
                  <InlineStack align="center">
                    <Badge status={badgeStatus}>{status.status}</Badge>
                  </InlineStack>
                  <Text variant="bodyMd">{status.count.toLocaleString()}</Text>
                  <BlockStack gap="100">
                    <Text variant="bodySm" color="subdued">{status.percentage}%</Text>
                    <ProgressBar progress={status.percentage} size="small" />
                  </BlockStack>
                </InlineStack>
              );
            })}
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderGeographicData = () => (
    <Layout>
      <Layout.Section>
        <Card title="Top Countries" sectioned>
          <DataTable
            columnContentTypes={['text', 'text', 'numeric', 'text']}
            headings={['Country', '', 'Visits', 'Percentage']}
            rows={analyticsData.topCountries.map((country) => [
              country.country,
              country.flag,
              country.visits.toLocaleString(),
              `${((country.visits / analyticsData.overview.uniqueVisitors) * 100).toFixed(1)}%`,
            ])}
          />
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderTrendChart = () => (
    <Layout>
      <Layout.Section>
        <Card title="Daily Tracking Lookups" sectioned>
          <BlockStack gap="400">
            <Text variant="bodySm" color="subdued">
              Tracking lookup trends over the selected time period
            </Text>
            <div style={{ 
              height: '200px', 
              backgroundColor: '#f9fafb', 
              border: '1px solid #e1e3e5',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BlockStack align="center" gap="200">
                <Icon source={AnalyticsMajor} color="subdued" />
                <Text variant="bodyMd" color="subdued">
                  Chart visualization would appear here
                </Text>
                <Text variant="bodySm" color="subdued">
                  Integration with charting library (Chart.js, D3, etc.)
                </Text>
              </BlockStack>
            </div>
            <InlineStack align="space-around">
              {analyticsData.trends.dailyLookups.slice(-7).map((day, index) => (
                <BlockStack key={index} align="center" gap="100">
                  <Text variant="bodySm" color="subdued">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text variant="bodyMd">{day.lookups}</Text>
                  <ProgressBar 
                    progress={(day.successful / day.lookups) * 100} 
                    size="small" 
                    color="success"
                  />
                </BlockStack>
              ))}
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  return (
    <Page
      title="Analytics"
      subtitle="Track your order tracking page performance and customer insights"
      primaryAction={{
        content: 'Export Data',
        onAction: handleExportData,
      }}
      secondaryActions={[
        {
          content: 'View Report',
          url: '/admin/reports/tracking',
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <InlineStack distribution="fillEvenly">
            <Select
              label="Date Range"
              options={dateRangeOptions}
              value={dateRange}
              onChange={handleDateRangeChange}
            />
            <Select
              label="View"
              options={metricOptions}
              value={selectedMetric}
              onChange={setSelectedMetric}
            />
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <Banner
            title="Analytics Insights"
            status="info"
            action={{
              content: 'Refresh Data',
              onAction: fetchAnalytics
            }}
          >
            <p>
              Your store analytics show {analyticsData.overview.totalLookups} total orders with a {analyticsData.overview.conversionRate}% fulfillment rate. 
              {analyticsData.overview.totalLookups > 0 ? 
                `Consider optimizing fulfillment processes to improve customer satisfaction.` : 
                'Start processing orders to see detailed analytics.'}
            </p>
          </Banner>
        </Layout.Section>

        {selectedMetric === 'overview' && renderOverviewCards()}
        {selectedMetric === 'traffic' && renderTrendChart()}
        {selectedMetric === 'orders' && renderCarrierAnalytics()}
        {selectedMetric === 'geographic' && renderGeographicData()}

        <Layout.Section>
          <Card title="Quick Actions" sectioned>
            <InlineStack>
              <Button size="slim" external url="/admin/apps/tracking/settings">
                Customize Tracking Page
              </Button>
              <Button size="slim" external url="/pages/track-order">
                View Live Page
              </Button>
              <Button size="slim" external url="/admin/orders">
                Manage Orders
              </Button>
            </InlineStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Performance Tips" sectioned>
            <List>
              <List.Item>
                <Text as="span" fontWeight="bold">Optimize for mobile:</Text> {analyticsData.overview.mobileTraffic}% of your visitors use mobile devices
              </List.Item>
              <List.Item>
                <Text as="span" fontWeight="bold">Reduce bounce rate:</Text> Current rate is {analyticsData.overview.bounceRate}% - consider adding more helpful content
              </List.Item>
              <List.Item>
                <Text as="span" fontWeight="bold">Carrier diversity:</Text> FedEx handles {analyticsData.topCarriers[0].percentage}% of shipments - consider diversifying
              </List.Item>
              <List.Item>
                <Text as="span" fontWeight="bold">International expansion:</Text> {analyticsData.topCountries.slice(1).reduce((sum, country) => sum + country.visits, 0)} international visitors show growth potential
              </List.Item>
            </List>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Analytics;