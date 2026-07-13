## 1. Backend Updates (auth_service)

- [x] 1.1 Add `name` to `RegisterRequest` in `services/auth_service/shared/DTO.py`
- [x] 1.2 Update `register` endpoint in `services/auth_service/routers/auth.py` to store name in `settings["name"]`
- [x] 1.3 Update `get_me` in `services/auth_service/routers/auth.py` to retrieve the name from settings first
- [x] 1.4 Implement custom proxy-aware client IP extractor `get_proxy_client_ip` in `services/auth_service/plugins/security/limiters/auth_limiter.py`
- [x] 1.5 Add `POST /auth/forgot-password` in `services/auth_service/routers/auth.py` to generate tokens and email them
- [x] 1.6 Add `POST /auth/reset-password` in `services/auth_service/routers/auth.py` to validate tokens and update password

## 2. API Gateway Updates

- [x] 2.1 Expose forgot-password and reset-password routes as proxies in `services/gateway/app/api/routes/auth.py`

## 3. Frontend Updates (my-react-app)

- [x] 3.1 Update error message extraction from `.detail` in `apps/react/frontend/my-react-app/src/modules/Auth/components/Login.tsx`
- [x] 3.2 Add forgot-password and reset-password TanStack Query hooks in `apps/react/frontend/my-react-app/src/hooks/api/useAuthApi.ts`
- [x] 3.3 Implement state handling, validation, and API integration in `apps/react/frontend/my-react-app/src/modules/Auth/components/ForgotPass.tsx`
- [x] 3.4 Create the Reset Password page (`ResetPassword.tsx`) and add it to the routing configuration
