# CHANGELOG

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.41 (2025-06-30)

### Bug Fixes

- **ci:** add security-events permission to enable CodeQL SARIF upload ([57de554](https://github.com/mohammed-taysser/foody/commit/57de554a9f1eac2d4fab48679c8e6d0eb3bfd370))

### Features

- add admin dashboard analytics with weekly stats and growth percent ([7985317](https://github.com/mohammed-taysser/foody/commit/7985317d6cc5126623f33a51a59c11421332cbd3))
- add AppError class, global error handler, and response wrapper, request logger (morgan), and 404 handler ([e7a1032](https://github.com/mohammed-taysser/foody/commit/e7a103282d2b3e4cdec94795cccda597412bfe14))
- add auth module with register and login using JWT and bcrypt ([7ea80e2](https://github.com/mohammed-taysser/foody/commit/7ea80e266e28afcca274b0765c9fbb66961fe22d))
- add helmet and rate limiting middleware to improve API security ([14a0cc6](https://github.com/mohammed-taysser/foody/commit/14a0cc679eac88415a7c56f5ff3876bdeed35efc))
- add image upload support with multer ([c0d8328](https://github.com/mohammed-taysser/foody/commit/c0d832828d1feed0aa1d2d6cdc359a7917cf45e6))
- add JWT authentication middleware and protect /me route ([78e33cf](https://github.com/mohammed-taysser/foody/commit/78e33cf2d7c71083ea891161e4c331ae20f9fc5c))
- add menu item categories with create/list endpoints and item assignment ([2c891f2](https://github.com/mohammed-taysser/foody/commit/2c891f29ce25a376b15b806a441b9d268f97d13e))
- add menu item creation and listing under restaurants ([4bd8992](https://github.com/mohammed-taysser/foody/commit/4bd89923b03321dd941beb924e526f986409b61e))
- add menu item pagination and filtering, category update/delete endpoints ([89cfd4a](https://github.com/mohammed-taysser/foody/commit/89cfd4a2cad371b11c22a8f706ded600004049ea))
- add order lifecycle handlers (status update, cancel, pay) with validation ([a38909a](https://github.com/mohammed-taysser/foody/commit/a38909a277998a222d072148b984a7e5421fc963))
- add PATCH /me endpoint for updating user profile ([3af0f60](https://github.com/mohammed-taysser/foody/commit/3af0f60dc483a08c524c19f93b0cf272429246fd))
- add RBAC middleware and role-based route access ([0b9f4a2](https://github.com/mohammed-taysser/foody/commit/0b9f4a22be394444fe9a7e592ca8cb1f2d6ab6e5))
- add refresh token ([4f768a2](https://github.com/mohammed-taysser/foody/commit/4f768a22c7ab0c65e36cf8e87a6abea40f0af5f2))
- add restaurant module with create and list endpoints ([55d37f5](https://github.com/mohammed-taysser/foody/commit/55d37f59d99104aa098d37ebdf96eb925d94830c))
- add update and delete endpoints for menu items with RBAC ([a4cc708](https://github.com/mohammed-taysser/foody/commit/a4cc708d216100217a862cd7fc3030d22a41acba))
- add zod-based environment variable validation ([c9a52ee](https://github.com/mohammed-taysser/foody/commit/c9a52ee29de667ca47b3f6dd90b17c3196717026))
- **cors:** configure CORS settings using environment variable for allowed origins ([d0bdf6b](https://github.com/mohammed-taysser/foody/commit/d0bdf6ba967f1650f9bf78579ec8b75328ceb5b9))
- create order module ([73b343b](https://github.com/mohammed-taysser/foody/commit/73b343b969bb7f3c3d58aa51c7659175701b0424))
- **git-hooks:** install Commitlint & commitizen ([2fd593e](https://github.com/mohammed-taysser/foody/commit/2fd593e2f784b814c6d91f6c1f8659e28cb2080c))
- **logging:** abstract request logging and daily log rotation into reusable services ([fba16f0](https://github.com/mohammed-taysser/foody/commit/fba16f091bb89d653ad0a41aaaf207afdf968eef))
- **logs:** add error and audit logging with DB logger integration ([56fd042](https://github.com/mohammed-taysser/foody/commit/56fd0429a9ff8db1b3aeabaa4e678a265fbe27af))
- **permission:** implement permission and permission group management ([edb5f33](https://github.com/mohammed-taysser/foody/commit/edb5f338b2d34a89522c875161a3a5fe63f03b70))
- seed realistic data with chalk logs and refactor token service ([709a4e0](https://github.com/mohammed-taysser/foody/commit/709a4e0f585db61c285aa049b0ff89f5d13095fb))
- **server:** add comprehensive network utilities including IP, port, ping, and MAC tools ([68e6dfe](https://github.com/mohammed-taysser/foody/commit/68e6dfec7bfbd36ce178d7b0ce655e7f3abe2687))
- setup express server with basic route ([6fe505a](https://github.com/mohammed-taysser/foody/commit/6fe505a659400ca7e9b75887e3e818c455f8c20e))
- setup Prisma with PostgreSQL and add User/Restaurant models ([fbc72a4](https://github.com/mohammed-taysser/foody/commit/fbc72a4f2be7b7ebd7e80830d37768da3b0c3ce0))
- **users, menu, category:** enhance endpoints and improve functionality ([3b2ba61](https://github.com/mohammed-taysser/foody/commit/3b2ba61f0630a574cfe13114c5a5103c641b83c4))
- **users:** add missing CRUD API endpoints ([e372df3](https://github.com/mohammed-taysser/foody/commit/e372df35f03367b600040eddb2b2f184b874a9ad))
- **utils:** create dayjsTZ wrapper using default timezone from .env ([734cbf6](https://github.com/mohammed-taysser/foody/commit/734cbf6ce5849c814096c99c90a9f97e2fcc50d9))
