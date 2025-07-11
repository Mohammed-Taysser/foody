import { Request, Response } from 'express';

import { DEFAULT_ROLE_PERMISSIONS } from './auth.constant';
import { LoginInput, RefreshTokenInput, RegisterInput } from './auth.validator';

import prisma from '@/apps/prisma';
import databaseLogger from '@/services/database-log.service';
import tokenService from '@/services/token.service';
import { BadRequestError, ConflictError, UnauthorizedError } from '@/utils/errors.utils';
import { getRequestInfo } from '@/utils/request.utils';
import { sendSuccessResponse } from '@/utils/send-response';

async function register(request: Request<unknown, unknown, RegisterInput>, response: Response) {
  const data = request.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (user) {
    throw new ConflictError('errors:email-already-exists');
  }

  const hashed = await tokenService.hash(data.password);

  const config = DEFAULT_ROLE_PERMISSIONS[data.role];

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role,
      permissionGroups: {
        connect: config.groups.map((name) => ({ name })),
      },
      permissions: {
        connect: config.permissions.map((id) => ({ key: id })),
      },
    },
  });

  const payload = { id: newUser.id, email: newUser.email, role: newUser.role };

  const accessToken = tokenService.signAccessToken(payload);
  const refreshToken = tokenService.signRefreshToken(payload);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUser } = newUser;

  databaseLogger.audit({
    requestInfo: getRequestInfo(request),
    actorId: newUser.id,
    actorType: 'USER',
    action: 'REGISTER',
    resource: 'USER',
    resourceId: newUser.id,
    metadata: { data: request.body },
  });

  sendSuccessResponse({
    response,
    message: 'User registered',
    data: { accessToken, refreshToken, user: restUser },
    statusCode: 201,
  });
}

async function login(request: Request<unknown, unknown, LoginInput>, response: Response) {
  const data = request.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new BadRequestError('errors:invalid-credentials');
  }

  const valid = await tokenService.compare(data.password, user.password);

  if (!valid) {
    if (user.failedLoginAttempts >= 5) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isBlocked: true },
      });
      throw new UnauthorizedError('errors:user-is-blocked');
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
      });
    }
    throw new BadRequestError('errors:invalid-credentials');
  }

  if (user.isBlocked) {
    throw new UnauthorizedError('errors:user-is-blocked');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0 }, // Reset failed attempts on successful login
  });

  if (!user.isActive) {
    throw new UnauthorizedError('errors:user-is-not-active');
  }

  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = tokenService.signAccessToken(payload);
  const refreshToken = tokenService.signRefreshToken(payload);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUser } = user;

  databaseLogger.audit({
    requestInfo: getRequestInfo(request),
    actorId: user.id,
    actorType: 'USER',
    action: 'LOGIN',
    resource: 'USER',
    resourceId: user.id,
    metadata: { data: request.body },
  });

  sendSuccessResponse({
    response,
    message: 'Login successful',
    data: { accessToken, refreshToken, user: restUser },
  });
}

function refreshToken(request: Request<unknown, unknown, RefreshTokenInput>, response: Response) {
  const { refreshToken } = request.body;

  try {
    const payload = tokenService.verifyToken<UserTokenPayload>(refreshToken);

    const newAccessToken = tokenService.signAccessToken(payload);
    const newRefreshToken = tokenService.signRefreshToken(payload);

    databaseLogger.audit({
      requestInfo: getRequestInfo(request),
      actorId: payload.id,
      actorType: 'USER',
      action: 'REFRESH_TOKEN',
      resource: 'USER',
      resourceId: payload.id,
      metadata: { data: request.body },
    });

    sendSuccessResponse({
      response,
      message: 'New access token issued',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch {
    throw new UnauthorizedError('errors:invalid-or-expired-refresh-token');
  }
}

async function resetUserPassword(request: Request, response: Response) {
  const data = request.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new BadRequestError('errors:user-is-not-found');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('errors:user-is-not-active');
  }

  if (user.isBlocked) {
    throw new UnauthorizedError('errors:user-is-blocked');
  }

  if (!user.isEmailVerified) {
    throw new UnauthorizedError('errors:user-is-not-verified');
  }

  const hashed = await tokenService.hash(data.password);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(request),
    actorId: user.id,
    actorType: 'USER',
    action: 'RESET_PASSWORD',
    resource: 'USER',
    resourceId: user.id,
    metadata: { data: request.body },
  });

  sendSuccessResponse({
    response,
    message: 'Password reset successful',
  });
}

async function sendResetPasswordCode(request: Request, response: Response) {
  const data = request.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new BadRequestError('errors:user-is-not-found');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('errors:user-is-not-active');
  }

  if (user.isBlocked) {
    throw new UnauthorizedError('errors:user-is-blocked');
  }

  if (!user.isEmailVerified) {
    throw new UnauthorizedError('errors:user-is-not-verified');
  }

  // generate a reset token
  const resetToken = tokenService.signResetPasswordToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetSentAt: new Date(),
    }, // 1 hour expiry
  });

  // Here you would typically send an email with a reset link
  // For simplicity, we will just log the action
  databaseLogger.audit({
    requestInfo: getRequestInfo(request),
    actorId: user.id,
    actorType: 'USER',
    action: 'SEND_RESET_PASSWORD_EMAIL',
    resource: 'USER',
    resourceId: user.id,
    metadata: { body: request.body, resetToken },
  });

  sendSuccessResponse({
    response,
    message: 'Reset password email sent',
  });
}

async function verifyResetPasswordToken(request: Request, response: Response) {
  const data = request.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new BadRequestError('errors:user-is-not-found');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('errors:user-is-not-active');
  }

  if (user.isBlocked) {
    throw new UnauthorizedError('errors:user-is-blocked');
  }

  if (!user.isEmailVerified) {
    throw new UnauthorizedError('errors:user-is-not-verified');
  }

  if (!user.passwordResetToken || !user.passwordResetSentAt) {
    throw new BadRequestError('errors:reset-token-not-found');
  }

  if (user.passwordResetSentAt < new Date(Date.now() - 3600000)) {
    // 1 hour expiry
    // If the token has expired, clear it and throw an error
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: null, // Clear the reset token
        passwordResetSentAt: null, // Clear the sent time
      },
    });

    throw new BadRequestError('errors:reset-token-expired');
  }

  if (data.resetToken !== user.passwordResetToken) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: null, // Clear the reset token
        passwordResetSentAt: null, // Clear the sent time
      },
    });

    throw new BadRequestError('errors:invalid-reset-token');
  }

  // If the token is valid, we can proceed to reset the password
  const hashed = await tokenService.hash(data.password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      passwordResetToken: null, // Clear the reset token
      passwordResetSentAt: null, // Clear the sent time
    },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(request),
    actorId: user.id,
    actorType: 'USER',
    action: 'VERIFY_RESET_PASSWORD_TOKEN',
    resource: 'USER',
    resourceId: user.id,
    metadata: { body: request.body, resetToken: data.resetToken },
  });

  sendSuccessResponse({
    response,
    message: 'Password reset successful',
  });
}

async function sendVerificationEmail(request: Request, response: Response) {
  const user = await prisma.user.findUnique({
    where: { email: request.body.email },
  });

  if (!user) {
    throw new BadRequestError('errors:user-is-not-found');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('errors:user-is-not-active');
  }

  if (user.isBlocked) {
    throw new UnauthorizedError('errors:user-is-blocked');
  }

  if (user.isEmailVerified) {
    throw new BadRequestError('errors:email-already-verified');
  }

  // generate a verification token
  const verificationToken = tokenService.signEmailVerificationToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationToken,
      emailVerificationSentAt: new Date(),
    }, // 1 hour expiry
  });

  // Here you would typically send an email with a verification link
  // For simplicity, we will just log the action
  databaseLogger.audit({
    requestInfo: getRequestInfo(request),
    actorId: user.id,
    actorType: 'USER',
    action: 'SEND_VERIFICATION_EMAIL',
    resource: 'USER',
    resourceId: user.id,
    metadata: { userId: user.id },
  });

  sendSuccessResponse({
    response,
    message: 'Verification email sent',
  });
}

async function verifyEmailToken(request: Request, response: Response) {
  const data = request.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new BadRequestError('errors:user-is-not-found');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('errors:user-is-not-active');
  }

  if (user.isBlocked) {
    throw new UnauthorizedError('errors:user-is-blocked');
  }

  if (user.isEmailVerified) {
    throw new BadRequestError('errors:email-already-verified');
  }

  if (!user.emailVerificationToken || !user.emailVerificationSentAt) {
    throw new BadRequestError('errors:verification-token-not-found');
  }

  if (user.emailVerificationSentAt < new Date(Date.now() - 3600000)) {
    // 1 hour expiry
    // If the token has expired, clear it and throw an error
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: null, // Clear the verification token
        emailVerificationSentAt: null, // Clear the sent time
      },
    });

    throw new BadRequestError('errors:verification-token-expired');
  }

  if (data.verificationToken !== user.emailVerificationToken) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: null, // Clear the verification token
        emailVerificationSentAt: null, // Clear the sent time
      },
    });

    throw new BadRequestError('errors:invalid-verification-token');
  }

  // If the token is valid, we can proceed to verify the email
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null, // Clear the verification token
      emailVerificationSentAt: null, // Clear the sent time
    },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(request),
    actorId: user.id,
    actorType: 'USER',
    action: 'VERIFY_EMAIL_TOKEN',
    resource: 'USER',
    resourceId: user.id,
    metadata: { body: request.body, verificationToken: data.verificationToken },
  });

  sendSuccessResponse({
    response,
    message: 'Email verification successful',
  });
}

export {
  login,
  refreshToken,
  register,
  resetUserPassword,
  sendResetPasswordCode,
  sendVerificationEmail,
  verifyEmailToken,
  verifyResetPasswordToken,
};
