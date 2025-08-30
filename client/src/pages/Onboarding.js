import React, { useState } from 'react';
import {
  Page,
  Layout,
  Card,
  Button,
  ButtonGroup,
  Text,
  InlineStack,
  BlockStack,
  Banner,
  List,
  Checkbox,
  TextField,
  ProgressBar,
  Icon,
} from '@shopify/polaris';
import {
  CircleTickMajor,
} from '@shopify/polaris-icons';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
const { apiClient, apiEndpoints } = api;

const Onboarding = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    trackingPageEnabled: true,
    trackingBlockEnabled: false,
    pageTitle: 'Track Your Order',
    notDispatchedMessage: 'Your order has not been dispatched yet. We will notify you once it ships.',
    trackingFoundMessage: 'Your tracking information:',
    showRecommendedProducts: false,
    showFaq: false,
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Complete setup mutation
  const completeSetupMutation = useMutation(
    async (data) => {
      return await apiClient.put(apiEndpoints.settings.update(), data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
        setCurrentStep(totalSteps + 1); // Show completion step
      }
    }
  );

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      completeSetupMutation.mutate(setupData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field) => (value) => {
    setSetupData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card title="Welcome to Smart Order Tracking!" sectioned>
            <BlockStack gap="500">
              <Text variant="bodyLg">
                Let's get your order tracking page set up in just a few minutes.
              </Text>
              
              <Banner status="info">
                <p>
                  This wizard will help you configure your tracking page to match your store's needs.
                </p>
              </Banner>
              
              <BlockStack>
                <Text variant="headingMd">What you'll accomplish:</Text>
                <List type="bullet">
                  <List.Item>Choose how customers will access tracking</List.Item>
                  <List.Item>Customize your tracking page content</List.Item>
                  <List.Item>Set up additional features</List.Item>
                  <List.Item>Go live with your tracking page</List.Item>
                </List>
              </BlockStack>
              
              <Text variant="bodySm" color="subdued">
                Don't worry - you can always change these settings later in the Settings page.
              </Text>
            </BlockStack>
          </Card>
        );

      case 2:
        return (
          <Card title="Choose Your Tracking Setup" sectioned>
            <BlockStack gap="500">
              <Text variant="bodyLg">
                How would you like customers to access order tracking?
              </Text>
              
              <BlockStack>
                <Checkbox
                  label="Create a dedicated tracking page"
                  helpText="Adds a new page at yourstore.com/pages/track-order"
                  checked={setupData.trackingPageEnabled}
                  onChange={handleInputChange('trackingPageEnabled')}
                />
                
                <Checkbox
                  label="Add tracking block to existing pages"
                  helpText="Allows you to add tracking to any page using the theme editor"
                  checked={setupData.trackingBlockEnabled}
                  onChange={handleInputChange('trackingBlockEnabled')}
                />
              </BlockStack>
              
              <Banner status="info">
                <p>
                  <strong>Recommended:</strong> Start with the dedicated tracking page. 
                  You can always add the block to other pages later.
                </p>
              </Banner>
            </BlockStack>
          </Card>
        );

      case 3:
        return (
          <Card title="Customize Your Content" sectioned>
            <BlockStack gap="500">
              <Text variant="bodyLg">
                Let's customize the messages your customers will see.
              </Text>
              
              <TextField
                label="Page title"
                value={setupData.pageTitle}
                onChange={handleInputChange('pageTitle')}
                helpText="The main heading on your tracking page"
              />
              
              <TextField
                label="Message for orders not yet shipped"
                value={setupData.notDispatchedMessage}
                onChange={handleInputChange('notDispatchedMessage')}
                multiline={2}
                helpText="What customers see when their order hasn't shipped yet"
              />
              
              <TextField
                label="Message when tracking is found"
                value={setupData.trackingFoundMessage}
                onChange={handleInputChange('trackingFoundMessage')}
                helpText="Appears above the tracking information"
              />
            </BlockStack>
          </Card>
        );

      case 4:
        return (
          <Card title="Additional Features" sectioned>
            <BlockStack gap="500">
              <Text variant="bodyLg">
                Would you like to enable these optional features?
              </Text>
              
              <Checkbox
                label="Show recommended products"
                helpText="Display product suggestions below tracking info to encourage additional purchases"
                checked={setupData.showRecommendedProducts}
                onChange={handleInputChange('showRecommendedProducts')}
              />
              
              <Checkbox
                label="Include FAQ section"
                helpText="Add a frequently asked questions section to help customers"
                checked={setupData.showFaq}
                onChange={handleInputChange('showFaq')}
              />
              
              <Banner status="success">
                <p>
                  <strong>Almost done!</strong> Click "Complete Setup" to activate your tracking page.
                </p>
              </Banner>
            </BlockStack>
          </Card>
        );

      case 5: // Completion step
        return (
          <Card sectioned>
            <BlockStack gap="500" align="center">
              <Icon source={CircleTickMajor} color="success" />
              
              <Text variant="headingLg" alignment="center">
                🎉 Your tracking page is now live!
              </Text>
              
              <Text variant="bodyLg" alignment="center">
                Customers can now track their orders using the page you just created.
              </Text>
              
              <BlockStack gap="200">
                <Text variant="headingMd">What's next?</Text>
                <List type="bullet">
                  <List.Item>Customize colors and branding in Settings</List.Item>
                  <List.Item>Test your tracking page with a sample order</List.Item>
                  <List.Item>Monitor usage in Analytics</List.Item>
                </List>
              </BlockStack>
              
              <ButtonGroup>
                <Button primary onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
                <Button onClick={() => navigate('/settings')}>
                  Customize Settings
                </Button>
              </ButtonGroup>
            </BlockStack>
          </Card>
        );

      default:
        return null;
    }
  };

  if (currentStep > totalSteps) {
    return (
      <Page title="Setup Complete">
        <Layout>
          <Layout.Section>
            {renderStep()}
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title={`Setup Wizard - Step ${currentStep} of ${totalSteps}`}
      subtitle="Get your order tracking page ready for customers"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="bodySm">Progress</Text>
                  <Text variant="bodySm">{Math.round(progress)}% complete</Text>
                </InlineStack>
                <ProgressBar progress={progress} size="small" />
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          {renderStep()}
        </Layout.Section>
        
        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <InlineStack align="space-between">
                <Button
                  disabled={currentStep === 1}
                  onClick={handlePrevious}
                >
                  Previous
                </Button>
                
                <Button
                  primary
                  onClick={handleNext}
                  loading={completeSetupMutation.isLoading}
                >
                  {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
                </Button>
              </InlineStack>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Onboarding;