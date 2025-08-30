import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Text,
  Button,
  Badge,
  InlineStack,
  BlockStack,
  Icon,
  Spinner,
  Banner,
  Modal,
} from '@shopify/polaris';
import {
  TransportMajor,
  LocationMajor,
  ClockMajor,
  ViewMajor,
} from '@shopify/polaris-icons';
import * as api from '../utils/api';

const { apiClient, apiEndpoints } = api;

const TrackingDetails = ({ order, onClose }) => {
  const [enhancedTracking, setEnhancedTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [carriers, setCarriers] = useState([]);

  const fetchEnhancedTracking = useCallback(async () => {
    if (!order?.trackingNumber || !order?.trackingCompany) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(
        apiEndpoints.tracking.enhanced(order.trackingCompany, order.trackingNumber)
      );
      
      if (response.success) {
        setEnhancedTracking(response.tracking);
      } else {
        setError('Failed to fetch enhanced tracking data');
      }
    } catch (err) {
      console.error('Enhanced tracking error:', err);
      setError('Unable to fetch live tracking data');
    } finally {
      setLoading(false);
    }
  }, [order?.trackingNumber, order?.trackingCompany]);

  useEffect(() => {
    if (order?.trackingNumber && order?.trackingCompany) {
      fetchEnhancedTracking();
    }
    fetchSupportedCarriers();
  }, [order, fetchEnhancedTracking]);

  const fetchSupportedCarriers = async () => {
    try {
      const response = await apiClient.get(apiEndpoints.tracking.carriers());
      if (response.success) {
        setCarriers(response.carriers || []);
      }
    } catch (err) {
      console.error('Error fetching carriers:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Delivered': { status: 'success', children: 'Delivered' },
      'Out for Delivery': { status: 'info', children: 'Out for Delivery' },
      'In Transit': { status: 'attention', children: 'In Transit' },
      'Picked Up': { status: 'warning', children: 'Picked Up' },
      'Processing': { status: 'warning', children: 'Processing' },
      'Exception': { status: 'critical', children: 'Exception' },
      'Returned': { status: 'critical', children: 'Returned' },
    };
    return <Badge {...(statusMap[status] || { children: status })} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const renderBasicTracking = () => (
    <Card sectioned>
      <BlockStack gap="400">
        <Text variant="headingMd" as="h3">
          Basic Tracking Information
        </Text>
        
        <InlineStack gap="400" align="space-between">
          <BlockStack gap="200">
            <Text variant="bodyMd" color="subdued">Tracking Number</Text>
            <Text variant="bodyLg">{order.trackingNumber}</Text>
          </BlockStack>
          
          <BlockStack gap="200">
            <Text variant="bodyMd" color="subdued">Carrier</Text>
            <Text variant="bodyLg">{order.trackingCompany}</Text>
          </BlockStack>
          
          <BlockStack gap="200">
            <Text variant="bodyMd" color="subdued">Status</Text>
            {getStatusBadge(order.fulfillmentStatus || 'Processing')}
          </BlockStack>
        </InlineStack>
        
        {order.trackingUrl && (
          <Button
            url={order.trackingUrl}
            external
            icon={ViewMajor}
          >
            Track on Carrier Website
          </Button>
        )}
      </BlockStack>
    </Card>
  );

  const renderEnhancedTracking = () => {
    if (!enhancedTracking) return null;

    return (
      <Card sectioned>
        <BlockStack gap="400">
          <InlineStack gap="200" align="space-between">
            <Text variant="headingMd" as="h3">
              Live Tracking Status
            </Text>
            {enhancedTracking.isLiveData === false && (
              <Badge status="info">Fallback Data</Badge>
            )}
          </InlineStack>
          
          <InlineStack gap="400" align="space-between">
            <BlockStack gap="200">
              <InlineStack gap="200" align="start">
                <Icon source={TransportMajor} color="base" />
                <BlockStack gap="100">
                  <Text variant="bodyMd" color="subdued">Current Status</Text>
                  {getStatusBadge(enhancedTracking.status)}
                </BlockStack>
              </InlineStack>
            </BlockStack>
            
            {enhancedTracking.location && (
              <BlockStack gap="200">
                <InlineStack gap="200" align="start">
                  <Icon source={LocationMajor} color="base" />
                  <BlockStack gap="100">
                    <Text variant="bodyMd" color="subdued">Current Location</Text>
                    <Text variant="bodyLg">{enhancedTracking.location}</Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            )}
            
            {enhancedTracking.estimatedDelivery && (
              <BlockStack gap="200">
                <InlineStack gap="200" align="start">
                  <Icon source={ClockMajor} color="base" />
                  <BlockStack gap="100">
                    <Text variant="bodyMd" color="subdued">Estimated Delivery</Text>
                    <Text variant="bodyLg">{formatDate(enhancedTracking.estimatedDelivery)}</Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            )}
          </InlineStack>
          
          {enhancedTracking.message && (
            <Banner status="info">
              <p>{enhancedTracking.message}</p>
            </Banner>
          )}
          
          {enhancedTracking.trackingUrl && (
            <Button
              url={enhancedTracking.trackingUrl}
              external
              icon={ViewMajor}
            >
              View Full Tracking Details
            </Button>
          )}
        </BlockStack>
      </Card>
    );
  };

  const renderTrackingEvents = () => {
    if (!enhancedTracking?.events || enhancedTracking.events.length === 0) {
      return null;
    }

    return (
      <Card sectioned>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h3">
            Tracking History
          </Text>
          
          <BlockStack gap="300">
            {enhancedTracking.events.map((event, index) => (
              <div key={index} style={{ 
                padding: '12px', 
                border: '1px solid #e1e3e5', 
                borderRadius: '8px',
                backgroundColor: index === 0 ? '#f6f6f7' : 'transparent'
              }}>
                <InlineStack gap="400" align="space-between">
                  <BlockStack gap="100">
                    <Text variant="bodyMd" fontWeight="medium">
                      {event.description}
                    </Text>
                    {event.location && (
                      <Text variant="bodyMd" color="subdued">
                        {event.location}
                      </Text>
                    )}
                  </BlockStack>
                  
                  <BlockStack gap="100" align="end">
                    <Text variant="bodyMd" color="subdued">
                      {formatDate(`${event.date} ${event.time}`)}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </div>
            ))}
          </BlockStack>
        </BlockStack>
      </Card>
    );
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Tracking Details - ${order?.orderNumber || order?.name}`}
      large
    >
      <Modal.Section>
        <BlockStack gap="400">
          {loading && (
            <Card sectioned>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spinner size="large" />
                <Text variant="bodyMd" as="p" color="subdued">
                  Fetching live tracking data...
                </Text>
              </div>
            </Card>
          )}
          
          {error && (
            <Banner status="warning">
              <p>{error}</p>
              <Button size="slim" onClick={fetchEnhancedTracking}>
                Retry
              </Button>
            </Banner>
          )}
          
          {renderBasicTracking()}
          {renderEnhancedTracking()}
          {renderTrackingEvents()}
          
          {carriers.length > 0 && (
            <Card sectioned>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  Supported Carriers
                </Text>
                <Text variant="bodyMd" color="subdued">
                  Live tracking data is available for: {carriers.filter(c => c.hasApi).map(c => c.name).join(', ')}
                </Text>
              </BlockStack>
            </Card>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
};

export default TrackingDetails;