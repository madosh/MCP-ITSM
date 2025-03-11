# MCP-ITSM System Diagrams

This file displays all the diagrams for the Model Context Protocol for ITSM integration.

## 1. System Architecture

```mermaid
flowchart TB
    subgraph Client
        UI[Frontend UI]
    end
    
    subgraph MCP-ITSM
        API[Backend API Server]
        AuthService[Authentication Service]
        ContextService[Context Management Service]
        IntegrationService[Integration Service]
        
        API --> AuthService
        API --> ContextService
        API --> IntegrationService
    end
    
    subgraph Persistence
        MongoDB[(MongoDB)]
    end
    
    subgraph ITSM Tools
        ServiceNow[ServiceNow]
        Jira[Jira]
        Zendesk[Zendesk]
        OtherITSM[Other ITSM]
    end
    
    UI <--> API
    AuthService <--> MongoDB
    ContextService <--> MongoDB
    IntegrationService <--> MongoDB
    
    IntegrationService <--> ServiceNow
    IntegrationService <--> Jira
    IntegrationService <--> Zendesk
    IntegrationService <--> OtherITSM
    
    subgraph AI/ML Models
        LLM[Language Models]
        ClassificationModels[Classification Models]
        PredictiveModels[Predictive Models]
    end
    
    ContextService <--> LLM
    ContextService <--> ClassificationModels
    ContextService <--> PredictiveModels
```

## 2. Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant ContextService
    participant IntegrationService
    participant ITSM
    participant DB as Database
    
    User->>Frontend: Request context for ticket
    Frontend->>API: GET /context/source/servicenow/external/{ticketId}
    
    API->>ContextService: Find context by source & external ID
    ContextService->>DB: Query for context
    
    alt Context exists
        DB->>ContextService: Return context data
        ContextService->>API: Return context
        API->>Frontend: Return context data
        Frontend->>User: Display context data
    else Context doesn't exist
        DB->>ContextService: No context found
        ContextService->>IntegrationService: Request data from ITSM
        IntegrationService->>ITSM: API request for ticket data
        ITSM->>IntegrationService: Return ticket data
        IntegrationService->>ContextService: Process & transform data
        ContextService->>DB: Save new context
        ContextService->>API: Return new context
        API->>Frontend: Return context data
        Frontend->>User: Display context data
    end
```

## 3. Entity Relationship

```mermaid
erDiagram
    User ||--o{ Context : creates
    User ||--o{ Integration : manages
    Context }o--|| Integration : source_from
    
    User {
        ObjectId _id
        string username
        string email
        string password
        string firstName
        string lastName
        enum role
        boolean isActive
        date lastLogin
        date createdAt
        date updatedAt
    }
    
    Context {
        ObjectId _id
        string name
        string description
        string source
        string externalId
        enum contentType
        object data
        object metadata
        number ttl
        date expiresAt
        number size
        ObjectId owner
        object accessControl
        number version
        enum status
        date createdAt
        date updatedAt
    }
    
    Integration {
        ObjectId _id
        string name
        string description
        enum type
        object config
        array endpoints
        boolean isActive
        object health
        ObjectId createdBy
        array managers
        date createdAt
        date updatedAt
    }
```

## 4. Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthAPI
    participant JWT
    participant DB as Database
    
    User->>Frontend: Enter credentials
    Frontend->>AuthAPI: POST /auth/login
    AuthAPI->>DB: Validate credentials
    
    alt Valid credentials
        DB->>AuthAPI: User found
        AuthAPI->>JWT: Generate token
        JWT->>AuthAPI: Return signed token
        AuthAPI->>Frontend: Return token & user data
        Frontend->>Frontend: Store token in localStorage
        Frontend->>User: Redirect to dashboard
    else Invalid credentials
        DB->>AuthAPI: Invalid user/password
        AuthAPI->>Frontend: Authentication failed
        Frontend->>User: Show error message
    end
    
    Note over User,Frontend: After login
    
    User->>Frontend: Access protected page
    Frontend->>Frontend: Check token
    
    alt Valid token
        Frontend->>AuthAPI: GET /auth/validate with token
        AuthAPI->>JWT: Verify token
        JWT->>AuthAPI: Token valid
        AuthAPI->>Frontend: Success response
        Frontend->>User: Display protected content
    else Invalid/expired token
        Frontend->>AuthAPI: GET /auth/validate with token
        AuthAPI->>JWT: Verify token
        JWT->>AuthAPI: Token invalid/expired
        AuthAPI->>Frontend: Unauthorized
        Frontend->>User: Redirect to login
    end
```

## 5. Context Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: Context created
    
    Created --> Active: Set status to active
    Active --> Archived: TTL expired or archived
    Active --> Active: Updated (version++)
    Active --> Pending: Set status to pending
    
    Pending --> Active: Set status to active
    Pending --> Archived: Set status to archived
    
    Archived --> [*]: Context deleted
    
    note right of Created
        New context with version=1
    end note
    
    note right of Active
        Accessible by authorized users
        Returned in API responses
    end note
    
    note right of Pending
        Not returned in normal API responses
        Used for drafts or pending review
    end note
    
    note right of Archived
        Read-only
        Only accessible via history API
    end note
```

## 6. Component Architecture

```mermaid
flowchart TB
    subgraph Frontend [Frontend Components]
        AuthModule[Authentication Module]
        ContextModule[Context Management Module]
        IntegrationModule[Integration Module]
        UserModule[User Management Module]
        
        AuthModule --- ContextModule
        AuthModule --- IntegrationModule
        AuthModule --- UserModule
    end
    
    subgraph Backend [Backend Components]
        Routes[API Routes]
        Middleware[Middleware Layer]
        Controllers[Controllers]
        Services[Service Layer]
        Models[Data Models]
        Utils[Utilities]
        
        Routes --> Middleware
        Middleware --> Controllers
        Controllers --> Services
        Services --> Models
        Services --> Utils
    end
    
    Frontend <--> Backend
``` 