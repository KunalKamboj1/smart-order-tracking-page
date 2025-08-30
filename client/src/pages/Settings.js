import React, { useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Button,
  InlineStack,
  BlockStack,
  Text,
  Banner,
  Tabs,
  ColorPicker,
  Thumbnail,
  DropZone,
  List,
  Divider,
  Toast,
  Frame,
} from '@shopify/polaris';

const Settings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // General Settings State
  const [trackingPageEnabled, setTrackingPageEnabled] = useState(true);
  const [pageTitle, setPageTitle] = useState('Track Your Order');
  const [pageDescription, setPageDescription] = useState('Enter your order number to track your shipment');
  const [autoEmailNotifications, setAutoEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Branding Settings State
  const [brandColor, setBrandColor] = useState({ hue: 120, brightness: 1, saturation: 1 });
  const [logoFile, setLogoFile] = useState(null);
  const [customCSS, setCustomCSS] = useState('');
  const [fontFamily, setFontFamily] = useState('system');

  // Messages Settings State
  const [notDispatchedMessage, setNotDispatchedMessage] = useState('Your order has not been dispatched yet. We will notify you once it ships.');
  const [trackingFoundMessage, setTrackingFoundMessage] = useState('Your tracking information:');
  const [orderNotFoundMessage, setOrderNotFoundMessage] = useState('Order not found. Please check your order number and try again.');
  const [deliveredMessage, setDeliveredMessage] = useState('Your order has been delivered successfully!');

  // Analytics Settings State
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [trackingPixel, setTrackingPixel] = useState('');
  const [googleAnalytics, setGoogleAnalytics] = useState('');

  const handleDropZoneDrop = useCallback(
    (files) => {
      setLogoFile(files[0]);
    },
    []
  );

  const showToast = (message) => {
    setToastMessage(message);
    setToastActive(true);
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    showToast('Settings saved successfully!');
  };

  const tabs = [
    {
      id: 'general',
      content: 'General',
      panelID: 'general-content',
    },
    {
      id: 'branding',
      content: 'Branding',
      panelID: 'branding-content',
    },
    {
      id: 'messages',
      content: 'Messages',
      panelID: 'messages-content',
    },
    {
      id: 'analytics',
      content: 'Analytics',
      panelID: 'analytics-content',
    },
  ];

  const fontOptions = [
    { label: 'System Default', value: 'system' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
  ];

  const renderGeneralSettings = () => (
    <Layout>
      <Layout.Section>
        <Card title="Tracking Page Settings" sectioned>
          <FormLayout>
            <Checkbox
              label="Enable tracking page"
              checked={trackingPageEnabled}
              onChange={setTrackingPageEnabled}
              helpText="Allow customers to track their orders on your store"
            />
            <TextField
              label="Page title"
              value={pageTitle}
              onChange={setPageTitle}
              helpText="The title that appears on your tracking page"
            />
            <TextField
              label="Page description"
              value={pageDescription}
              onChange={setPageDescription}
              multiline={3}
              helpText="Description text shown to customers"
            />
          </FormLayout>
        </Card>
      </Layout.Section>

      <Layout.Section>
        <Card title="Notification Settings" sectioned>
          <FormLayout>
            <Checkbox
              label="Automatic email notifications"
              checked={autoEmailNotifications}
              onChange={setAutoEmailNotifications}
              helpText="Send automatic emails when order status changes"
            />
            <Checkbox
              label="SMS notifications"
              checked={smsNotifications}
              onChange={setSmsNotifications}
              helpText="Send SMS updates to customers (requires SMS service setup)"
            />
          </FormLayout>
        </Card>
      </Layout.Section>

      <Layout.Section>
        <Card title="Preview" sectioned>
          <BlockStack>
            <Text variant="headingMd">Live Preview</Text>
            <div style={{ 
              border: '1px solid #e1e3e5', 
              borderRadius: '8px', 
              padding: '20px',
              backgroundColor: '#f9fafb'
            }}>
              <Text variant="headingLg">{pageTitle}</Text>
              <Text color="subdued">{pageDescription}</Text>
            </div>
            <Button external url="/pages/track-order" size="slim">
              View Live Page
            </Button>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderBrandingSettings = () => (
    <Layout>
      <Layout.Section>
        <Card title="Logo & Colors" sectioned>
          <FormLayout>
            <BlockStack>
              <Text variant="headingMd">Logo Upload</Text>
              <DropZone onDrop={handleDropZoneDrop}>
                {logoFile ? (
                  <BlockStack>
                    <Thumbnail
                      source={window.URL.createObjectURL(logoFile)}
                      alt="Uploaded logo"
                      size="large"
                    />
                    <Text variant="bodySm" color="subdued">{logoFile.name}</Text>
                  </BlockStack>
                ) : (
                  <DropZone.FileUpload />
                )}
              </DropZone>
              <Text variant="bodySm" color="subdued">Upload your logo (PNG, JPG, SVG recommended)</Text>
            </BlockStack>

            <BlockStack>
              <Text variant="headingMd">Brand Color</Text>
              <ColorPicker
                onChange={setBrandColor}
                color={brandColor}
              />
              <Text variant="bodySm" color="subdued">Choose your primary brand color</Text>
            </BlockStack>

            <Select
              label="Font Family"
              options={fontOptions}
              value={fontFamily}
              onChange={setFontFamily}
            />
          </FormLayout>
        </Card>
      </Layout.Section>

      <Layout.Section>
        <Card title="Custom CSS" sectioned>
          <FormLayout>
            <TextField
              label="Custom CSS"
              value={customCSS}
              onChange={setCustomCSS}
              multiline={8}
              helpText="Add custom CSS to further customize your tracking page appearance"
              placeholder=".tracking-page { /* Your custom styles */ }"
            />
          </FormLayout>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderMessagesSettings = () => (
    <Layout>
      <Layout.Section>
        <Card title="Status Messages" sectioned>
          <FormLayout>
            <TextField
              label="Order not dispatched message"
              value={notDispatchedMessage}
              onChange={setNotDispatchedMessage}
              multiline={3}
              helpText="Message shown when order hasn't shipped yet"
            />
            <TextField
              label="Tracking found message"
              value={trackingFoundMessage}
              onChange={setTrackingFoundMessage}
              helpText="Message shown above tracking information"
            />
            <TextField
              label="Order not found message"
              value={orderNotFoundMessage}
              onChange={setOrderNotFoundMessage}
              multiline={2}
              helpText="Message shown when order number is invalid"
            />
            <TextField
              label="Delivered message"
              value={deliveredMessage}
              onChange={setDeliveredMessage}
              multiline={2}
              helpText="Message shown when order is delivered"
            />
          </FormLayout>
        </Card>
      </Layout.Section>

      <Layout.Section>
        <Card title="Message Variables" sectioned>
          <Text variant="headingMd">Available Variables</Text>
          <List>
            <List.Item>{'{'}{'{'} order_number {'}'}{'}'}  - Order number</List.Item>
            <List.Item>{'{'}{'{'} customer_name {'}'}{'}'}  - Customer name</List.Item>
            <List.Item>{'{'}{'{'} tracking_number {'}'}{'}'}  - Tracking number</List.Item>
            <List.Item>{'{'}{'{'} carrier {'}'}{'}'}  - Shipping carrier</List.Item>
            <List.Item>{'{'}{'{'} estimated_delivery {'}'}{'}'}  - Estimated delivery date</List.Item>
          </List>
          <Text variant="bodySm" color="subdued">Use these variables in your messages for dynamic content</Text>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderAnalyticsSettings = () => (
    <Layout>
      <Layout.Section>
        <Card title="Analytics & Tracking" sectioned>
          <FormLayout>
            <Checkbox
              label="Enable analytics tracking"
              checked={analyticsEnabled}
              onChange={setAnalyticsEnabled}
              helpText="Track page views and customer interactions"
            />
            <TextField
              label="Google Analytics ID"
              value={googleAnalytics}
              onChange={setGoogleAnalytics}
              placeholder="GA-XXXXXXXXX-X"
              helpText="Your Google Analytics tracking ID"
            />
            <TextField
              label="Custom tracking pixel"
              value={trackingPixel}
              onChange={setTrackingPixel}
              multiline={3}
              placeholder="<script>/* Your tracking code */</script>"
              helpText="Add custom tracking pixels or scripts"
            />
          </FormLayout>
        </Card>
      </Layout.Section>

      <Layout.Section>
        <Card title="Data & Privacy" sectioned>
          <BlockStack>
            <Text variant="headingMd">Data Collection</Text>
            <List>
              <List.Item>Order lookup attempts</List.Item>
              <List.Item>Page views and session duration</List.Item>
              <List.Item>Device and browser information</List.Item>
              <List.Item>Geographic location (country/region)</List.Item>
            </List>
            <Text variant="bodySm" color="subdued">This data helps improve the tracking experience</Text>
            
            <Divider />
            
            <InlineStack>
              <Button size="slim">Export Data</Button>
              <Button size="slim" destructive>Delete All Data</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderGeneralSettings();
      case 1:
        return renderBrandingSettings();
      case 2:
        return renderMessagesSettings();
      case 3:
        return renderAnalyticsSettings();
      default:
        return renderGeneralSettings();
    }
  };

  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      onDismiss={() => setToastActive(false)}
    />
  ) : null;

  return (
    <Frame>
      {toastMarkup}
      <Page
        title="Settings"
        subtitle="Customize your order tracking experience"
        primaryAction={{
          content: 'Save Settings',
          onAction: handleSave,
        }}
        secondaryActions={[
          {
            content: 'Reset to Defaults',
            destructive: true,
          },
        ]}
      >
        <Layout>
          <Layout.Section>
            <Banner
              title="Pro Tip"
              status="info"
            >
              <p>
                Test your changes on the live tracking page to see how they appear to customers.
                Changes are saved automatically as you type.
              </p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Tabs
                tabs={tabs}
                selected={activeTab}
                onSelect={setActiveTab}
              >
                <Card.Section>
                  {renderTabContent()}
                </Card.Section>
              </Tabs>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
};

export default Settings;