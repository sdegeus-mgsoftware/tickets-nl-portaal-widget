# Widget Configuration

## API Client Configuration Options

The widget's API client supports the following configuration options:

```javascript
const config = {
  // Required: Your portaal API URL
  apiUrl: 'https://your-portaal-domain.com/api',
  
  // Optional: Default project ID for tickets
  projectId: 'your-default-project-id',
  
  // Optional: Default organization ID for tickets
  organizationId: 'your-default-organization-id'
};

const apiClient = new ApiClient(config);
```

## Configuration Methods

### Getting Current Config
```javascript
const currentConfig = apiClient.getConfig();
console.log(currentConfig);
// {
//   baseUrl: 'https://your-portaal-domain.com/api',
//   projectId: 'your-project-id',
//   organizationId: 'your-organization-id',
//   retryAttempts: 3,
//   retryDelay: 1000
// }
```

### Setting Values Dynamically
```javascript
// Set project ID
apiClient.setProjectId('new-project-id');

// Set organization ID  
apiClient.setOrganizationId('new-organization-id');

// Set base URL
apiClient.setBaseUrl('https://new-domain.com/api');

// Update multiple config values
apiClient.updateConfig({
  projectId: 'new-project',
  organizationId: 'new-org'
});
```

### Getting Individual Values
```javascript
const projectId = apiClient.getProjectId();
const organizationId = apiClient.getOrganizationId();
const baseUrl = apiClient.getBaseUrl();
```

## Ticket Creation with Config Defaults

When creating tickets, the API client will use configured defaults:

```javascript
// This will use config.organizationId if not provided
const result = await apiClient.createTicket({
  title: 'My ticket',
  description: 'Ticket description',
  requester_id: 'user-123'
  // organization_id: not needed if set in config
  // project_id: not needed if set in config
});
```

## Priority Order for Values

When creating tickets, values are used in this priority order:

1. **Explicitly passed in ticket data** (highest priority)
2. **Widget configuration defaults** 
3. **API client defaults** (lowest priority)

### Example:
```javascript
// Config has organizationId: 'config-org'
const apiClient = new ApiClient({ organizationId: 'config-org' });

// This ticket will use 'explicit-org' (overrides config)
await apiClient.createTicket({
  title: 'Test',
  organization_id: 'explicit-org',
  requester_id: 'user-123'
});

// This ticket will use 'config-org' (from config)
await apiClient.createTicket({
  title: 'Test',
  requester_id: 'user-123'
});
```