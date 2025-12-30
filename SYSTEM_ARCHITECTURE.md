# MCP-ITSM System Architecture

## Overview Diagram

```mermaid
graph TB
    subgraph "External Systems"
        LLM[LLM/Claude API<br/>AI Processing]
        SN[ServiceNow<br/>ITSM Platform]
        JIRA[Jira<br/>ITSM Platform]
        ZD[Zendesk<br/>ITSM Platform]
    end

    subgraph "Frontend Layer - React SPA"
        Browser[User Browser]

        subgraph "App Shell"
            EB[ErrorBoundary<br/>Global Error Handler]
            Router[React Router]
            Header[Header Component]
            Footer[Footer Component]
        end

        subgraph "Pages"
            Login[Login Page]
            Dashboard[Dashboard<br/>Integration Overview]
            AIChat[LLMChatClient<br/>AI-Assisted Chat]
            IntList[Integrations List]
            IntDetail[Integration Detail]
            Profile[User Profile]
            UserMgmt[User Management<br/>Admin Only]
        end

        subgraph "Chat Components"
            ChatMsg[ChatMessageList]
            ChatInput[ChatInputForm]
            TicketPreview[TicketPreviewPanel]
        end

        subgraph "Custom Hooks"
            UseChatHistory[useChatHistory<br/>Message State]
            UseContext[useConversationContext<br/>MCP Context State]
        end

        subgraph "Services"
            AuthSvc[authService<br/>Login/Logout/Token]
            IntSvc[integrationService<br/>CRUD Operations]
            UserSvc[userService<br/>User Management]
            LLMSvc[llmService<br/>AI Processing]
            TicketSvc[ticketService<br/>Ticket Operations]
        end

        subgraph "Guards"
            PrivateRoute[PrivateRoute<br/>Auth Guard]
        end
    end

    subgraph "Backend Layer - Express.js API"
        API[Express Server<br/>Port 5000]

        subgraph "Middleware Stack"
            CORS[CORS<br/>Cross-Origin]
            Helmet[Helmet<br/>Security Headers]
            Compression[Compression<br/>gzip]
            Morgan[Morgan<br/>HTTP Logging]
            RateLimit[Rate Limiter<br/>DDoS Protection]
            AuthMW[authenticate()<br/>JWT Verification]
            AuthzMW[authorize()<br/>Role Check]
            ValMW[validate()<br/>Joi Schema]
        end

        subgraph "Route Handlers"
            AuthRoutes[Auth Routes<br/>/api/auth]
            ContextRoutes[Context Routes<br/>/api/context]
            IntRoutes[Integration Routes<br/>/api/integration]
            UserRoutes[User Routes<br/>/api/users]
            HealthRoutes[Health Check<br/>/health]
        end

        subgraph "Validators"
            AuthVal[authValidator<br/>login/register schemas]
            CtxVal[contextValidator<br/>CRUD schemas]
            IntVal[integrationValidator<br/>CRUD schemas]
        end

        subgraph "Models - Mongoose ODM"
            UserModel[User Model<br/>Credentials/Roles]
            CtxModel[Context Model<br/>MCP Context Storage]
            IntModel[Integration Model<br/>ITSM Configs]
        end

        subgraph "Utils"
            Logger[Winston Logger<br/>Structured Logging]
            Config[Configuration<br/>Environment Variables]
        end
    end

    subgraph "Database Layer"
        MongoDB[(MongoDB<br/>Document Store)]

        subgraph "Collections"
            UsersCol[users<br/>Authentication Data]
            ContextCol[contexts<br/>MCP Context Data]
            IntCol[integrations<br/>ITSM Configurations]
        end
    end

    subgraph "MCP Server Layer"
        MCPServer[MCP Server<br/>index.js]

        subgraph "MCP Protocol"
            StdIO[stdio Transport<br/>JSON Messages]
            ToolRegistry[Tool Registry<br/>7 ITSM Tools]
        end

        subgraph "MCP Tools"
            CreateTicket[create_ticket<br/>Create new tickets]
            GetTicket[get_ticket<br/>Retrieve ticket]
            UpdateTicket[update_ticket<br/>Modify ticket]
            ListTickets[list_tickets<br/>Query tickets]
            AssignTicket[assign_ticket<br/>Assign to user]
            AddComment[add_comment<br/>Add comments]
            SearchKB[search_knowledge_base<br/>KB articles]
        end
    end

    %% Frontend Connections
    Browser --> EB
    EB --> Router
    Router --> Header
    Router --> Footer
    Router --> Login
    Router --> Dashboard
    Router --> AIChat
    Router --> IntList
    Router --> IntDetail
    Router --> Profile
    Router --> UserMgmt

    AIChat --> ChatMsg
    AIChat --> ChatInput
    AIChat --> TicketPreview
    AIChat --> UseChatHistory
    AIChat --> UseContext

    Dashboard --> IntSvc
    AIChat --> LLMSvc
    AIChat --> TicketSvc
    AIChat --> IntSvc
    Login --> AuthSvc
    IntList --> IntSvc
    IntDetail --> IntSvc
    Profile --> UserSvc
    UserMgmt --> UserSvc

    PrivateRoute --> AuthSvc
    Router --> PrivateRoute

    %% Service to Backend
    AuthSvc -.HTTP.-> API
    IntSvc -.HTTP.-> API
    UserSvc -.HTTP.-> API
    LLMSvc -.HTTP.-> API
    TicketSvc -.HTTP.-> API

    %% Backend Middleware Flow
    API --> CORS
    CORS --> Helmet
    Helmet --> Compression
    Compression --> Morgan
    Morgan --> RateLimit
    RateLimit --> AuthMW
    AuthMW --> AuthzMW
    AuthzMW --> ValMW

    %% Routes and Validators
    ValMW --> AuthRoutes
    ValMW --> ContextRoutes
    ValMW --> IntRoutes
    ValMW --> UserRoutes
    ValMW --> HealthRoutes

    AuthRoutes --> AuthVal
    ContextRoutes --> CtxVal
    IntRoutes --> IntVal

    %% Models
    AuthRoutes --> UserModel
    ContextRoutes --> CtxModel
    IntRoutes --> IntModel
    UserRoutes --> UserModel

    %% Utils
    AuthRoutes --> Logger
    ContextRoutes --> Logger
    IntRoutes --> Logger
    UserRoutes --> Logger
    AuthRoutes --> Config

    %% Database
    UserModel --> MongoDB
    CtxModel --> MongoDB
    IntModel --> MongoDB
    MongoDB --> UsersCol
    MongoDB --> ContextCol
    MongoDB --> IntCol

    %% MCP Server
    LLMSvc -.MCP Protocol.-> MCPServer
    MCPServer --> StdIO
    MCPServer --> ToolRegistry
    ToolRegistry --> CreateTicket
    ToolRegistry --> GetTicket
    ToolRegistry --> UpdateTicket
    ToolRegistry --> ListTickets
    ToolRegistry --> AssignTicket
    ToolRegistry --> AddComment
    ToolRegistry --> SearchKB

    %% External Integrations
    CreateTicket -.API.-> SN
    CreateTicket -.API.-> JIRA
    CreateTicket -.API.-> ZD
    GetTicket -.API.-> SN
    GetTicket -.API.-> JIRA
    GetTicket -.API.-> ZD
    LLMSvc -.API.-> LLM

    %% Styling
    classDef frontend fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef backend fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef database fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef mcp fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef external fill:#f3e5f5,stroke:#4a148c,stroke-width:2px

    class Browser,EB,Router,Header,Footer,Login,Dashboard,AIChat,IntList,IntDetail,Profile,UserMgmt,ChatMsg,ChatInput,TicketPreview,UseChatHistory,UseContext,AuthSvc,IntSvc,UserSvc,LLMSvc,TicketSvc,PrivateRoute frontend
    class API,CORS,Helmet,Compression,Morgan,RateLimit,AuthMW,AuthzMW,ValMW,AuthRoutes,ContextRoutes,IntRoutes,UserRoutes,HealthRoutes,AuthVal,CtxVal,IntVal,UserModel,CtxModel,IntModel,Logger,Config backend
    class MongoDB,UsersCol,ContextCol,IntCol database
    class MCPServer,StdIO,ToolRegistry,CreateTicket,GetTicket,UpdateTicket,ListTickets,AssignTicket,AddComment,SearchKB mcp
    class LLM,SN,JIRA,ZD external
```

---

## Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant PrivateRoute
    participant AuthService
    participant API
    participant AuthMW
    participant UserModel
    participant MongoDB

    User->>Frontend: Navigate to /dashboard
    Frontend->>PrivateRoute: Check authentication
    PrivateRoute->>AuthService: isAuthenticated()
    AuthService->>AuthService: Check localStorage token

    alt No token
        AuthService-->>PrivateRoute: false
        PrivateRoute->>Frontend: Redirect to /login
        Frontend->>User: Show login page
        User->>Frontend: Enter credentials
        Frontend->>API: POST /api/auth/login
        API->>AuthMW: validate(loginSchema)
        AuthMW->>UserModel: findOne({ email or username })
        UserModel->>MongoDB: Query users collection
        MongoDB-->>UserModel: User document
        UserModel->>UserModel: comparePassword()
        UserModel->>UserModel: JWT.sign()
        UserModel-->>API: { token, user }
        API-->>Frontend: 200 OK + token
        Frontend->>AuthService: Save token to localStorage
        Frontend->>User: Redirect to /dashboard
    else Has token
        AuthService-->>PrivateRoute: true
        PrivateRoute->>Frontend: Render Dashboard
        Frontend->>API: GET /api/integration (with token)
        API->>AuthMW: authenticate()
        AuthMW->>AuthMW: Verify JWT token
        AuthMW->>UserModel: findById(decoded.id)
        UserModel->>MongoDB: Query users
        MongoDB-->>UserModel: User data
        UserModel-->>AuthMW: User object
        AuthMW->>AuthMW: Check isActive
        AuthMW->>API: req.user = userObject
        API->>AuthMW: authorize(['admin', 'integrator'])
        AuthMW->>AuthMW: Check req.user.role
        alt Authorized
            AuthMW->>API: next()
            API-->>Frontend: 200 OK + data
            Frontend->>User: Display integrations
        else Unauthorized
            AuthMW-->>Frontend: 403 Forbidden
            Frontend->>User: Show error message
        end
    end
```

---

## AI-Assisted Ticket Creation Flow

```mermaid
sequenceDiagram
    participant User
    participant AIChat
    participant ChatInput
    participant ChatMsg
    participant TicketPreview
    participant LLMService
    participant TicketService
    participant MCPServer
    participant LLM
    participant ITSM[ITSM System]

    User->>AIChat: Type issue description
    AIChat->>ChatInput: Render input form
    User->>ChatInput: Submit message
    ChatInput->>AIChat: handleSubmit(message)

    AIChat->>ChatMsg: Add user message
    ChatMsg->>User: Display message

    AIChat->>LLMService: processTicketRequest()
    LLMService->>LLMService: Extract priority keywords
    LLMService->>LLMService: Detect category
    LLMService->>LLMService: Parse summary/description

    alt LLM Mode Enabled
        LLMService->>MCPServer: Send MCP request
        MCPServer->>LLM: Process with AI model
        LLM-->>MCPServer: AI response
        MCPServer-->>LLMService: Extracted ticket data
    else Simulated Mode
        LLMService->>LLMService: Rule-based extraction
    end

    LLMService-->>AIChat: { message, extractedData, confirmCreate }

    AIChat->>ChatMsg: Add AI response
    ChatMsg->>User: Display AI analysis

    AIChat->>TicketPreview: Show extracted data
    TicketPreview->>User: Display ticket preview

    User->>TicketPreview: Click "Create Ticket"
    TicketPreview->>AIChat: handleCreateTicket()

    AIChat->>TicketService: createTicket(systemId, ticketData)
    TicketService->>MCPServer: create_ticket tool call
    MCPServer->>ITSM: API request
    ITSM-->>MCPServer: Ticket created (ID: INC001)
    MCPServer-->>TicketService: { ticketId, ticketUrl }
    TicketService-->>AIChat: Success response

    AIChat->>ChatMsg: Add success message
    ChatMsg->>User: Display "Ticket created!"
```

---

## Data Validation Flow

```mermaid
sequenceDiagram
    participant Client
    participant Route
    participant ValidateMW[validate() Middleware]
    participant JoiSchema
    participant Handler[Route Handler]
    participant Model
    participant DB[MongoDB]

    Client->>Route: POST /api/integration
    Route->>ValidateMW: Intercept request
    ValidateMW->>JoiSchema: schema.validate(req.body)

    alt Validation Fails
        JoiSchema-->>ValidateMW: { error: [...] }
        ValidateMW->>ValidateMW: Format error details
        ValidateMW-->>Client: 400 Bad Request<br/>{ errors: [{field, message}] }
    else Validation Passes
        JoiSchema-->>ValidateMW: { value: sanitizedData }
        ValidateMW->>ValidateMW: req.body = sanitizedData
        ValidateMW->>Handler: next()
        Handler->>Model: new Integration(data)
        Model->>Model: Mongoose validation
        Model->>DB: Save document
        DB-->>Model: Saved document
        Model-->>Handler: Integration object
        Handler-->>Client: 201 Created + data
    end
```

---

## Resource Access Control Flow

```mermaid
flowchart TD
    Start[Incoming Request] --> Auth{Authenticated?}
    Auth -->|No| Reject401[401 Unauthorized]
    Auth -->|Yes| RoleCheck{Role-based<br/>Authorization?}

    RoleCheck -->|Yes| HasRole{Has Required<br/>Role?}
    HasRole -->|No| Reject403[403 Forbidden]
    HasRole -->|Yes| ResourceCheck{Resource-based<br/>Authorization?}

    RoleCheck -->|No| ResourceCheck

    ResourceCheck -->|No| Allow[Allow Access]
    ResourceCheck -->|Yes| LoadResource[Load Resource<br/>from DB]

    LoadResource --> CheckAdmin{Is Admin?}
    CheckAdmin -->|Yes| Allow
    CheckAdmin -->|No| CheckOwner{Is Owner?}

    CheckOwner -->|Yes| Allow
    CheckOwner -->|No| CheckCreator{Is Creator?}

    CheckCreator -->|Yes| Allow
    CheckCreator -->|No| CheckManager{Is Manager?}

    CheckManager -->|Yes| Allow
    CheckManager -->|No| CheckPublic{Is Public?}

    CheckPublic -->|Yes| Allow
    CheckPublic -->|No| CheckAllowedUser{In Allowed<br/>Users?}

    CheckAllowedUser -->|Yes| Allow
    CheckAllowedUser -->|No| CheckAllowedRole{Has Allowed<br/>Role?}

    CheckAllowedRole -->|Yes| Allow
    CheckAllowedRole -->|No| Reject403

    Allow --> ProcessRequest[Process Request]
    ProcessRequest --> Response[Return Response]

    style Start fill:#e3f2fd
    style Auth fill:#fff3e0
    style RoleCheck fill:#fff3e0
    style ResourceCheck fill:#fff3e0
    style Allow fill:#c8e6c9
    style Reject401 fill:#ffcdd2
    style Reject403 fill:#ffcdd2
    style Response fill:#c8e6c9
```

---

## Database Schema Relationships

```mermaid
erDiagram
    USER ||--o{ CONTEXT : owns
    USER ||--o{ INTEGRATION : creates
    USER }o--o{ INTEGRATION : manages
    INTEGRATION ||--o{ ENDPOINT : contains
    CONTEXT }o--|| INTEGRATION : "linked to"

    USER {
        ObjectId _id PK
        string username UK
        string email UK
        string password "bcrypt hashed"
        string firstName
        string lastName
        enum role "admin, user, integrator"
        boolean isActive
        datetime lastLogin
        datetime createdAt
        datetime updatedAt
    }

    CONTEXT {
        ObjectId _id PK
        string name
        string description
        string source "ITSM system name"
        string externalId "External ticket ID"
        enum contentType "ticket, conversation, kb, process"
        mixed data "Context payload"
        mixed metadata
        number ttl "Time-to-live seconds"
        datetime expiresAt "Auto-delete time"
        number size "Data size in bytes"
        number version "Versioning"
        enum status "active, archived, pending"
        ObjectId owner FK
        object accessControl
        datetime createdAt
        datetime updatedAt
    }

    INTEGRATION {
        ObjectId _id PK
        string name UK
        string description
        enum type "servicenow, jira, zendesk, custom"
        object config
        array endpoints
        boolean isActive
        object health
        ObjectId createdBy FK
        array managers "Array of User IDs"
        datetime createdAt
        datetime updatedAt
    }

    ENDPOINT {
        string name
        string path
        enum method "GET, POST, PUT, DELETE, PATCH"
        boolean enabled
        mixed requestMapping
        mixed responseMapping
    }
```

---

## Component State Management

```mermaid
stateDiagram-v2
    [*] --> Initializing: Component Mount

    Initializing --> LoadingIntegrations: useEffect()
    LoadingIntegrations --> IntegrationsLoaded: Success
    LoadingIntegrations --> Error: API Failure

    IntegrationsLoaded --> Idle: Ready
    Error --> Idle: User Dismisses

    state Idle {
        [*] --> NoMessage
        NoMessage --> TypingMessage: User Types
        TypingMessage --> MessageReady: Has Text
        MessageReady --> NoMessage: Clear Input
    }

    MessageReady --> ProcessingLLM: Submit (LLM Mode)
    MessageReady --> ProcessingDirect: Submit (Direct Mode)

    state ProcessingLLM {
        [*] --> CallingLLM
        CallingLLM --> ExtractingData
        ExtractingData --> ShowingPreview
    }

    state ProcessingDirect {
        [*] --> CreatingTicket
        CreatingTicket --> TicketCreated
    }

    ShowingPreview --> AwaitingConfirmation: Display Preview

    state AwaitingConfirmation {
        [*] --> Previewing
        Previewing --> Refining: User Clicks Refine
        Previewing --> ConfirmedCreate: User Clicks Create
    }

    Refining --> Idle: Dismiss Preview
    ConfirmedCreate --> CreatingFromExtracted: API Call
    CreatingFromExtracted --> TicketCreated: Success
    CreatingFromExtracted --> Error: Failure

    TicketCreated --> Idle: Show Confirmation
    Error --> Idle: Show Error

    Idle --> [*]: Component Unmount
```

---

## MCP Server Tool Execution Flow

```mermaid
sequenceDiagram
    participant Client[LLM/Client]
    participant MCP[MCP Server]
    participant Registry[Tool Registry]
    participant Handler[Tool Handler]
    participant ITSM[ITSM System API]

    Client->>MCP: stdio message
    MCP->>MCP: Parse JSON message

    alt tool_call format (new)
        MCP->>MCP: Extract tool name & params
    else function_call format (legacy)
        MCP->>MCP: Convert to tool_call format
    end

    MCP->>Registry: Get tool handler
    Registry-->>MCP: Handler function

    alt create_ticket
        MCP->>Handler: createTicket(params)
        Handler->>Handler: Validate params
        Handler->>Handler: Map to ITSM format
        Handler->>ITSM: POST /api/tickets
        ITSM-->>Handler: { id: "INC001" }
        Handler-->>MCP: Success response
    else get_ticket
        MCP->>Handler: getTicket(params)
        Handler->>ITSM: GET /api/tickets/{id}
        ITSM-->>Handler: Ticket data
        Handler-->>MCP: Ticket details
    else update_ticket
        MCP->>Handler: updateTicket(params)
        Handler->>ITSM: PUT /api/tickets/{id}
        ITSM-->>Handler: Updated ticket
        Handler-->>MCP: Success response
    else list_tickets
        MCP->>Handler: listTickets(params)
        Handler->>ITSM: GET /api/tickets?filter
        ITSM-->>Handler: Ticket list
        Handler-->>MCP: Array of tickets
    else assign_ticket
        MCP->>Handler: assignTicket(params)
        Handler->>ITSM: PUT /api/tickets/{id}/assign
        ITSM-->>Handler: Assignment confirmed
        Handler-->>MCP: Success response
    else add_comment
        MCP->>Handler: addComment(params)
        Handler->>ITSM: POST /api/tickets/{id}/comments
        ITSM-->>Handler: Comment added
        Handler-->>MCP: Success response
    else search_knowledge_base
        MCP->>Handler: searchKB(params)
        Handler->>ITSM: GET /api/kb/search?q=
        ITSM-->>Handler: KB articles
        Handler-->>MCP: Search results
    end

    MCP->>MCP: Format response
    MCP->>Client: stdio JSON response
```

---

## Error Boundary Error Handling

```mermaid
stateDiagram-v2
    [*] --> Normal: App Running

    Normal --> ErrorCaught: JavaScript Error
    ErrorCaught --> LogError: componentDidCatch()
    LogError --> UpdateState: Set hasError=true
    UpdateState --> RenderFallback: Render Error UI

    state RenderFallback {
        [*] --> ShowingError
        ShowingError --> DevMode: NODE_ENV=development
        ShowingError --> ProdMode: NODE_ENV=production

        DevMode --> DisplayStack: Show stack trace
        ProdMode --> DisplayGeneric: User-friendly message
    }

    RenderFallback --> AwaitingAction: Display recovery options

    state AwaitingAction {
        [*] --> Waiting
        Waiting --> TryAgain: Click "Try Again"
        Waiting --> GoHome: Click "Go to Home"
        Waiting --> Reload: Click "Reload Page"
    }

    TryAgain --> ResetState: Clear error state
    ResetState --> Normal: Re-render component

    GoHome --> Navigate: window.location.href = '/'
    Navigate --> [*]

    Reload --> FullReload: window.location.reload()
    FullReload --> [*]
```

---

## API Request/Response Cycle

```mermaid
sequenceDiagram
    participant Browser
    participant Axios
    participant Interceptor
    participant Express
    participant MW[Middleware Stack]
    participant Route
    participant Model
    participant DB

    Browser->>Axios: API call
    Axios->>Interceptor: Request interceptor
    Interceptor->>Interceptor: Add Bearer token
    Interceptor->>Express: HTTP Request

    Express->>MW: CORS
    MW->>MW: Helmet (Security Headers)
    MW->>MW: Compression
    MW->>MW: Morgan (Logging)
    MW->>MW: Rate Limit Check

    alt Rate Limit Exceeded
        MW-->>Express: 429 Too Many Requests
        Express-->>Browser: Error response
    else Rate Limit OK
        MW->>MW: authenticate()
        alt Invalid Token
            MW-->>Express: 401 Unauthorized
            Express-->>Browser: Auth error
        else Valid Token
            MW->>MW: authorize()
            alt Insufficient Role
                MW-->>Express: 403 Forbidden
                Express-->>Browser: Permission denied
            else Authorized
                MW->>MW: validate()
                alt Validation Failed
                    MW-->>Express: 400 Bad Request
                    Express-->>Browser: Validation errors
                else Valid Input
                    MW->>Route: Route handler
                    Route->>Model: Database operation
                    Model->>DB: Query/Update
                    DB-->>Model: Result
                    Model-->>Route: Processed data
                    Route-->>Express: Success response
                    Express-->>Browser: 200/201 + data
                    Browser->>Browser: Update UI
                end
            end
        end
    end
```

---

## Technology Stack Overview

```mermaid
graph LR
    subgraph "Frontend Stack"
        React[React 18<br/>UI Framework]
        ReactRouter[React Router 6<br/>Routing]
        Bootstrap[React Bootstrap<br/>UI Components]
        Axios[Axios<br/>HTTP Client]
    end

    subgraph "Backend Stack"
        Express[Express.js<br/>Web Framework]
        Mongoose[Mongoose 7<br/>ODM]
        JWT[jsonwebtoken<br/>Auth]
        Joi[Joi 17<br/>Validation]
        Bcrypt[bcryptjs<br/>Hashing]
        Winston[Winston<br/>Logging]
    end

    subgraph "Database Stack"
        Mongo[MongoDB<br/>NoSQL Database]
        Indexes[Indexes<br/>Performance]
        TTL[TTL Indexes<br/>Auto-Expiration]
    end

    subgraph "MCP Stack"
        Node[Node.js<br/>Runtime]
        StdIO[stdio<br/>Transport]
        JSON[JSON<br/>Message Format]
    end

    subgraph "Security Stack"
        Helmet[Helmet<br/>HTTP Headers]
        RateLimit[express-rate-limit<br/>DDoS Protection]
        CORS[cors<br/>Cross-Origin]
        Validation[Input Validation<br/>Injection Prevention]
    end

    React --> Axios
    ReactRouter --> React
    Bootstrap --> React
    Axios --> Express

    Express --> Mongoose
    Express --> JWT
    Express --> Joi
    Express --> Bcrypt
    Express --> Winston
    Express --> Helmet
    Express --> RateLimit
    Express --> CORS

    Mongoose --> Mongo
    Mongo --> Indexes
    Mongo --> TTL

    Node --> StdIO
    StdIO --> JSON

    style React fill:#61dafb
    style Express fill:#68a063
    style Mongo fill:#13aa52
    style Node fill:#539e43
```

