# Supabase Reconnection Guide

## Problem
After not using the gestionale for a few minutes, users are forced to refresh the entire page to see real-time updates again.

## Solution
We've implemented a Reddit-suggested solution that automatically reconnects Supabase subscriptions when the page becomes visible again.

## Implementation

### 1. Heartbeat System (`hooks/useSupabaseHeartbeat.ts`)
A heartbeat system that sends periodic requests to keep the connection active:
- Configurable intervals (default: 60 seconds - 1 minute)
- Timeout handling (default: 5 seconds)
- Automatic pause/resume based on page visibility
- Failure detection and connection health monitoring

### 2. Connection Manager (`hooks/useSupabaseConnectionManager.ts`)
A comprehensive connection manager that combines heartbeat and reconnection:
- Heartbeat monitoring with health scoring
- Automatic reconnection on failures
- Visibility change detection
- Connection health assessment (excellent/good/poor/critical)

### 3. Reconnection Hook (`hooks/useSupabaseReconnection.ts`)
A generic hook that handles Supabase subscription reconnection with visibility change detection.

### 4. Appointments with Heartbeat Hook (`hooks/useAppointmentsWithHeartbeat.ts`)
A specialized hook that combines appointment subscriptions with heartbeat functionality:
- Automatic reconnection when page becomes visible
- Heartbeat integration to keep connection alive
- Batch updates to minimize re-renders
- Error handling and retry logic
- Automatic appointment refresh on connection restore

### 5. Enhanced Query Functions (`app/(dashboard)/(private)/crm/dashboard/query/query.tsx`)
Added `setupAppointmentsSubscriptionWithReconnection()` function that includes reconnection logic.

## Usage

### Basic Usage in Components

```typescript
import { useAppointmentsWithReconnection } from '@/hooks/useAppointmentsWithReconnection';

function MyComponent() {
  const [appointments, setAppointments] = useState([]);
  
  const { connectionStatus, lastError, reconnect } = useAppointmentsWithReconnection({
    setAppointments,
    salonId: 'your-salon-id',
    onConnectionStatusChange: (status) => {
      console.log('Connection status changed:', status);
    }
  });

  return (
    <div>
      {connectionStatus !== 'connected' && (
        <div className="text-red-500">
          Connection: {connectionStatus}
          {lastError && <div>Error: {lastError}</div>}
          <button onClick={reconnect}>Reconnect</button>
        </div>
      )}
      {/* Your appointments display */}
    </div>
  );
}
```

### Using the Connection Manager (Recommended)

```typescript
import { useSupabaseConnectionManager } from '@/hooks/useSupabaseConnectionManager';

function MyComponent() {
  const {
    connectionStatus,
    isConnected,
    heartbeatActive,
    heartbeatCount,
    healthScore,
    connectionHealth,
    reconnect,
    forceHeartbeat
     } = useSupabaseConnectionManager({
     heartbeatInterval: 60000, // 60 seconds (1 minute)
     heartbeatTimeout: 5000, // 5 seconds
     reconnectOnHeartbeatFailure: true,
     reconnectOnVisibilityChange: true,
    onConnectionStatusChange: (status) => {
      console.log('Connection status:', status);
    },
    onHeartbeatSuccess: () => {
      console.log('Heartbeat successful');
    },
    onReconnectionSuccess: () => {
      console.log('Reconnection successful');
    }
  });

  return (
    <div>
      <div>Status: {connectionStatus}</div>
      <div>Heartbeat: {heartbeatActive ? 'Active' : 'Inactive'} ({heartbeatCount})</div>
      <div>Health: {connectionHealth} ({healthScore}%)</div>
      {!isConnected && <button onClick={reconnect}>Reconnect</button>}
      <button onClick={() => forceHeartbeat()}>Force Heartbeat</button>
    </div>
  );
}
```

### Using the Heartbeat Hook

```typescript
import { useSupabaseHeartbeat } from '@/hooks/useSupabaseHeartbeat';

function MyComponent() {
  const {
    isActive,
    lastHeartbeat,
    heartbeatCount,
    lastError,
    startHeartbeat,
    stopHeartbeat,
    forceHeartbeat
     } = useSupabaseHeartbeat({
     interval: 60000, // 60 seconds (1 minute)
     timeout: 5000, // 5 seconds
     onHeartbeatSuccess: () => {
      console.log('Heartbeat successful');
    },
    onHeartbeatError: (error) => {
      console.error('Heartbeat failed:', error);
    }
  });

  return (
    <div>
      <div>Heartbeat Active: {isActive ? 'Yes' : 'No'}</div>
      <div>Count: {heartbeatCount}</div>
      <div>Last: {lastHeartbeat?.toLocaleTimeString()}</div>
      {lastError && <div>Error: {lastError}</div>}
      <button onClick={() => forceHeartbeat()}>Force Heartbeat</button>
    </div>
  );
}
```

### Using the Generic Reconnection Hook

## Features

### Heartbeat System
- **Periodic Requests**: Sends requests every 60 seconds (1 minute) to keep connection alive
- **Timeout Handling**: 5-second timeout for heartbeat requests
- **Visibility Awareness**: Pauses heartbeat when page is hidden, resumes when visible
- **Health Monitoring**: Tracks connection health score (0-100%)
- **Failure Detection**: Detects consecutive failures and triggers reconnection
- **Throttling**: Prevents excessive calls with minimum intervals between requests
- **Loop Prevention**: Prevents multiple simultaneous heartbeat calls

### Automatic Reconnection
- Detects when the page becomes visible again
- Automatically reconnects subscriptions
- Handles network interruptions gracefully
- Triggers reconnection on heartbeat failures

### Exponential Backoff
- Retries failed connections with increasing delays
- Maximum retry delay of 30 seconds
- Prevents overwhelming the server

### Connection Health Assessment
- **Excellent** (90-100%): Optimal performance
- **Good** (70-89%): Acceptable performance
- **Poor** (40-69%): Performance issues
- **Critical** (0-39%): Connection problems

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Graceful degradation when connections fail

### Performance Optimizations
- Batch updates to minimize re-renders
- Efficient subscription management
- Memory leak prevention
- Smart heartbeat scheduling

## Integration with Existing Code

The new hooks are designed to work alongside existing subscription code. You can:

1. **Gradually migrate** existing subscriptions to use the new hooks
2. **Keep existing code** and add reconnection as an enhancement
3. **Use both approaches** for different types of subscriptions

## Testing the Solution

1. Open the gestionale in a browser tab
2. Switch to another tab or application
3. Wait for a few minutes
4. Switch back to the gestionale tab
5. The connection should automatically reconnect without requiring a page refresh

## Monitoring

The navbar now shows comprehensive connection information:
- **Database Status**: Connection to Supabase database
- **Heartbeat Status**: Active heartbeat with count and health score
- **Real-time Status**: Subscription connection status
- **Health Indicators**: Color-coded dots showing connection health
  - Green: Excellent/Connected
  - Yellow: Good/Connecting
  - Orange: Poor
  - Red: Critical/Error

## Troubleshooting

### Connection Not Reconnecting
1. Check browser console for error messages
2. Verify Supabase configuration
3. Check network connectivity
4. Ensure the page is actually becoming visible

### Performance Issues
1. Monitor the number of active subscriptions
2. Check for memory leaks in component cleanup
3. Verify batch update timing

### Error Messages
- `Subscription failed: TIMED_OUT` - Network timeout
- `Subscription failed: CLOSED` - Connection closed
- `Subscription failed: CHANNEL_ERROR` - Channel configuration error

## Future Enhancements

1. **WebSocket Fallback** - Add WebSocket fallback for better reliability
2. **Connection Pooling** - Implement connection pooling for multiple subscriptions
3. **Advanced Retry Logic** - Add more sophisticated retry strategies
4. **Connection Metrics** - Add detailed connection metrics and analytics
5. **User Notifications** - Add user notifications for connection status changes 