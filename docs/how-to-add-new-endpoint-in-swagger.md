# How to Add a New Endpoint in Swagger (OpenAPI) YAML

Swagger (OpenAPI) files describe your REST API endpoints, their inputs, outputs, and other metadata. You write these in YAML or JSON format.

## 1. Understanding Existing Endpoint Structure

Example of an existing endpoint:

```yaml
paths:
  /auth/login:
    post:
      summary: 'Login a user'
      tags:
        - Auth
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AuthRequest'
      responses:
        '200':
          description: 'Successful login'
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
```

- **paths**: Defines all URL endpoints.
- **/auth/login**: The URL path.
- **post**: The HTTP method (could be get, post, patch, delete, etc.)
- **summary**: Short description of the endpoint.
- **tags**: Groups endpoints by category.
- **requestBody**: Defines expected input (if any).
- **responses**: Possible HTTP responses with status codes and schemas.

## 2. Steps to Add a New Endpoint

### Step A: Choose your path and HTTP method

Example:

You want to add `GET /restaurants/{id}` to get a restaurant by its ID.

### Step B: Add path with parameters and method

```yaml
paths:
  /restaurants/{id}:
    get:
      summary: 'Get a restaurant by ID'
      tags:
        - Restaurants
      parameters:
        - name: id
          in: path
          required: true
          description: 'Restaurant ID'
          schema:
            type: string
      responses:
        '200':
          description: 'Restaurant found'
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Restaurant'
        '404':
          description: 'Restaurant not found'
```

### Step C: Define parameters

- **parameters** is a list where you specify inputs like path variables, query parameters, or headers.
- For a path parameter, set `in: path` and `required: true`.

### Step D: Define request body (if applicable)

If your endpoint requires a `JSON` body (e.g., `POST` or `PATCH`), define:

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/YourSchema'
```

### Step E: Define responses

- Each response is keyed by HTTP status code (like "200", "400", "404").
- Describe the response and optionally provide a schema reference.

## 3. Example: Adding a New POST Endpoint to Create a Restaurant

```yaml
paths:
  /restaurants:
    post:
      summary: 'Create a new restaurant'
      tags:
        - Restaurants
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RestaurantInput'
      responses:
        '201':
          description: 'Restaurant created successfully'
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Restaurant'
        '400':
          description: 'Invalid input data'
```

Make sure you have a schema like:

```yaml
components:
  schemas:
    RestaurantInput:
      type: object
      required:
        - name
      properties:
        name:
          type: string
          description: 'Name of the restaurant'
        description:
          type: string
        location:
          type: string
```

## How to Describe Existing Endpoints

Each endpoint should ideally have:

| Field         | Description                                                               |
| ------------- | ------------------------------------------------------------------------- |
| `summary`     | One-line description of what the endpoint does                            |
| `description` | (Optional) A detailed explanation of the endpoint, inputs, and edge cases |
| `parameters`  | Path/query/header parameters (type, required, description)                |
| `requestBody` | JSON body schema (use `$ref` if shared schema)                            |
| `responses`   | Response status codes with JSON response body schema                      |
| `tags`        | For grouping by feature/module                                            |
| `security`    | Whether it requires authentication (e.g. `bearerAuth`)                    |

## Tips for Good Swagger Documentation

### Endpoint Tips

- Group logically using `tags`: e.g., `Users`, `Restaurants`, `Orders`
- Use `summary` for short descriptions and `description` for longer notes.
- **Document parameters carefully**: Include `description`, `required`, and `schema` info.
- **Avoid redundancy**: if all endpoints return a consistent wrapper (`SuccessResponse`), use `$ref`.

### Schema & Reuse Tips

- Reuse schemas using `$ref` (e.g., `components/schemas/User`) to avoid repetition.
- Use `enum` for constrained strings (e.g., role, status).
- Document example responses using `example`: or `examples`: blocks.

### Validation & Error Clarity

- Include typical error responses (e.g. `400`, `401`, `403`, `404`) with examples.
- Provide **field-level constraints** (minLength, maxLength, format, etc.).

### Developer Experience

- Document `default`, `optional`, and `required` fields clearly.
- Add **examples** for input and output objects.
- Use `nullable: true` where needed.
- **Be consistent**: Follow naming conventions and style used in your file.
- **Test with tools**: Use Swagger Editor (<https://editor.swagger.io>) to validate your YAML.
- **Use security**: If endpoint requires authentication, add security section:

  ```yaml
  security:
    - bearerAuth: []
  ```
