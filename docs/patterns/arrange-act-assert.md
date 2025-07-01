# AAA Pattern Overview

The Arrange-Act-Assert (AAA) pattern is a simple and widely used structure for writing clean, readable, and maintainable tests, especially in unit and integration testing (including Jest or Mocha in Node.js).

| Step        | What it Does                              | Example                            |
| ----------- | ----------------------------------------- | ---------------------------------- |
| **Arrange** | Set up the test data, dependencies, mocks | Prepare inputs, mock DB            |
| **Act**     | Execute the code under test               | Call the function or API           |
| **Assert**  | Verify the result                         | Check output, status, side effects |

## Example: Node.js (TypeScript) Unit Test Using Jest

Let's say you’re testing a function that sends a WhatsApp message:

```ts
// sendMessage.ts
export function sendMessage(to: string, message: string): string {
  if (!to || !message) throw new Error('Invalid input');
  return `Message sent to ${to}`;
}
```

Test with AAA Pattern

```ts
// sendMessage.test.ts
import { sendMessage } from './sendMessage';

describe('sendMessage()', () => {
  it('should return success message when input is valid', () => {
    // Arrange
    const recipient = '+123456789';
    const content = 'Hello, world!';

    // Act
    const result = sendMessage(recipient, content);

    // Assert
    expect(result).toBe(`Message sent to ${recipient}`);
  });

  it('should throw error if input is invalid', () => {
    // Arrange
    const recipient = '';
    const content = '';

    // Act & Assert
    expect(() => sendMessage(recipient, content)).toThrow('Invalid input');
  });
});
```

## Why Use AAA?

- **Readability**: Others can follow your test flow clearly.
- **Maintainability**: Easier to isolate what’s broken if a test fails.
- **Consistency**: All your tests follow the same structure.

## Use AAA in E2E Tests Too

```ts
// With Supertest
it('GET /users/:id returns user', async () => {
  // Arrange
  const userId = 1;

  // Act
  const res = await request(app).get(`/users/${userId}`);

  // Assert
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('id', 1);
});
```
