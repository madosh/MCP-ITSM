# ITSM Integration Platform Diagrams

This document renders all the Mermaid diagrams for the ITSM Integration Platform in one place for easy reference.

## System Architecture

```mermaid
flowchart TB
    subgraph Client
        UI[React Frontend]
        Dashboard[Dashboard]
        IntegrationsUI[Integrations Management UI]
        UsersUI[User Management UI]
        
        UI --> Dashboard
        UI --> IntegrationsUI
        UI --> UsersUI
    end
    
    subgraph ITSM_Integration_Platform
        API[REST API Server]
        AuthModule[Authentication Module]
        UserModule[User Management Module]
        IntegrationModule[Integration Management Module]
        HealthModule[Health Monitoring Module]
        
        API --> AuthModule
        API --> UserModule
        API --> IntegrationModule
        API --> HealthModule
    end
    
    subgraph Persistence
        MongoDB[(MongoDB)]
        TokenStorage[JWT Token Storage]
    end
    
    subgraph ITSM_Systems
        ServiceNow[ServiceNow]
        Jira[Jira]
        Zendesk[Zendesk]
        Other[Other ITSM Tools]
    end
    
    subgraph Monitoring
        Prometheus[Prometheus]
        Grafana[Grafana Dashboards]
        AlertManager[Alert Manager]
    end
    
    UI <--> API
    AuthModule <--> MongoDB
    UserModule <--> MongoDB
    IntegrationModule <--> MongoDB
    AuthModule <--> TokenStorage
    
    IntegrationModule <--> ServiceNow
    IntegrationModule <--> Jira
    IntegrationModule <--> Zendesk
    IntegrationModule <--> Other
    
    API --> Prometheus
    Prometheus --> Grafana
    Prometheus --> AlertManager
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as React Frontend
    participant API as REST API
    participant Auth as Authentication Module
    participant DB as MongoDB
    
    %% User Login Flow
    User->>Frontend: Enter Credentials
    Frontend->>API: POST /api/auth/login
    API->>Auth: Validate Credentials
    Auth->>DB: Query User
    DB-->>Auth: Return User Data
    
    alt Invalid Credentials
        Auth-->>API: Authentication Failed
        API-->>Frontend: 401 Unauthorized
        Frontend-->>User: Show Error
    else Valid Credentials
        Auth->>Auth: Generate JWT Token
        Auth-->>API: Return Token + User Data
        API-->>Frontend: 200 OK with Token + User Data
        Frontend->>Frontend: Store Token in localStorage
        Frontend-->>User: Redirect to Dashboard
    end
    
    %% Authenticated Request Flow
    User->>Frontend: Request Protected Resource
    Frontend->>Frontend: Check for Token
    
    alt No Token
        Frontend-->>User: Redirect to Login
    else Token Exists
        Frontend->>API: Request with Authorization Header
        API->>Auth: Verify Token
        
        alt Invalid/Expired Token
            Auth-->>API: Token Invalid
            API-->>Frontend: 401 Unauthorized
            Frontend->>Frontend: Clear Token
            Frontend-->>User: Redirect to Login
        else Valid Token
            Auth-->>API: Token Valid (User Role & ID)
            API->>API: Check Authorization for Resource
            
            alt Unauthorized for Resource
                API-->>Frontend: 403 Forbidden
                Frontend-->>User: Show Access Denied
            else Authorized
                API->>DB: Process Request
                DB-->>API: Return Data
                API-->>Frontend: 200 OK with Data
                Frontend-->>User: Display Data
            end
        end
    end
```

## Integration Workflow

```mermaid
flowchart TD
    %% Integration Creation Flow
    subgraph Creation
        C1[Admin/Integrator] --> C2[Create Integration]
        C2 --> C3[Configure Endpoints]
        C3 --> C4[Set Auth Method]
        C4 --> C5[Define Managers]
        C5 --> C6[Save Integration]
        C6 --> C7{Health Check}
        C7 -->|Success| C8[Active Integration]
        C7 -->|Failure| C9[Integration Needs Attention]
    end
    
    %% Integration Usage Flow
    subgraph Usage
        U1[Client Application] --> U2[Request Data]
        U2 --> U3[API Server]
        U3 --> U4[Integration Module]
        U4 --> U5{Integration Active?}
        
        U5 -->|Yes| U6[Get Config]
        U6 --> U7[Prepare Request]
        U7 --> U8[Execute Request to ITSM]
        U8 --> U9{ITSM Response}
        U9 -->|Success| U10[Process Response]
        U9 -->|Error| U11[Log Error]
        U10 --> U12[Return Data]
        U11 --> U13[Return Error]
        
        U5 -->|No| U14[Return Inactive Error]
    end
    
    %% Health Monitoring Flow
    subgraph Monitoring
        M1[Scheduled Task] --> M2[Check All Integrations]
        M2 --> M3[For Each Integration]
        M3 --> M4{Integration Active?}
        M4 -->|Yes| M5[Call Health Endpoint]
        M5 --> M6{Response OK?}
        M6 -->|Yes| M7[Update Health: Healthy]
        M6 -->|No| M8[Update Health: Unhealthy]
        M4 -->|No| M9[Update Health: Inactive]
        
        M7 --> M10[Log Success]
        M8 --> M11[Trigger Alert]
        M9 --> M12[No Action]
    end
    
    %% Relationships
    C8 -.-> U4
    C9 -.-> M11
    U13 -.-> M11
    M2 -.-> C7
```

## Monitoring Architecture

```mermaid
flowchart LR
    %% API and Metrics Sources
    subgraph API[API Server]
        direction TB
        Metrics[Metrics Endpoint]
        HealthCheck[Health Check Endpoint]
        RequestMetrics[Request Duration Metrics]
        ErrorMetrics[Error Rate Metrics]
        IntegrationMetrics[Integration Health Metrics]
        
        RequestMetrics --> Metrics
        ErrorMetrics --> Metrics
        IntegrationMetrics --> Metrics
    end
    
    %% Monitoring Stack
    subgraph Monitoring[Monitoring Stack]
        direction TB
        Prometheus[Prometheus Server]
        Grafana[Grafana]
        AlertManager[Alert Manager]
        
        Prometheus --> Grafana
        Prometheus --> AlertManager
    end
    
    %% Notification Channels
    subgraph Notifications[Notification Channels]
        Email[Email Alerts]
        Slack[Slack Notifications]
        PagerDuty[PagerDuty]
        Webhook[Custom Webhooks]
    end
    
    %% Dashboard Types
    subgraph Dashboards[Grafana Dashboards]
        APIPerformance[API Performance]
        IntegrationHealth[Integration Health Status]
        ErrorRates[Error Rates]
        SystemResources[System Resources]
    end
    
    %% Connections
    Metrics --> Prometheus
    HealthCheck --> Prometheus
    
    AlertManager --> Email
    AlertManager --> Slack
    AlertManager --> PagerDuty
    AlertManager --> Webhook
    
    Grafana --> APIPerformance
    Grafana --> IntegrationHealth
    Grafana --> ErrorRates
    Grafana --> SystemResources
    
    %% External Monitoring
    UptimeRobot[Uptime Robot]
    StatusPage[Status Page]
    
    UptimeRobot --> HealthCheck
    AlertManager --> StatusPage
```

## Data Model

```mermaid
erDiagram
    USER {
        string _id PK
        string firstName
        string lastName
        string email UK
        string password
        string role
        boolean isActive
        date createdAt
        date updatedAt
    }
    
    INTEGRATION {
        string _id PK
        string name UK
        string description
        string type
        object config
        array endpoints
        boolean isActive
        object health
        string createdBy FK
        array managers
        date createdAt
        date updatedAt
    }
    
    CONFIG {
        string baseUrl
        object auth
        object settings
    }
    
    ENDPOINT {
        string name
        string path
        string method
        array parameters
    }
    
    HEALTH {
        string status
        date lastChecked
        string message
    }
    
    AUTH {
        string type
        object credentials
    }
    
    USER ||--o{ INTEGRATION : "creates"
    USER ||--o{ INTEGRATION : "manages"
    INTEGRATION ||--|{ ENDPOINT : "contains"
    INTEGRATION ||--|| CONFIG : "has"
    INTEGRATION ||--|| HEALTH : "monitored by"
    CONFIG ||--|| AUTH : "uses"
``` 