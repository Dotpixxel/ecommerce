import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * Check if a user exists by email or phone number
 * Uses oRPC mutation pattern
 */
export function useCheckUserExists() {
	return useMutation(orpc.auth.checkUserExists.mutationOptions());
}

/**
 * Sign in with email and password
 * Automatically handles error states and displays toasts
 */
export function useEmailSignIn() {
	return useMutation({
		mutationFn: async (opts: Parameters<typeof authClient.signIn.email>[0]) => {
			const res = await authClient.signIn.email(opts);
			if (res?.error) {
				throw new Error(res.error.message || "Giriş yapılamadı");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error signing in with email:", error);
			toast.error(`Giriş Hatası: ${error.message}`);
		},
		onSuccess() {
			toast.success("Başarıyla giriş yapıldı");
		},
	});
}

/**
 * Alias for useEmailSignIn
 */
export const useAuthSignIn = useEmailSignIn;

/**
 * Sign up with email, password, and name
 * Triggers Better-Auth email verification flow
 * REQUIRED: Both email and phoneNumber
 */
export function useEmailSignUp() {
	return useMutation({
		mutationFn: async (opts: Parameters<typeof authClient.signUp.email>[0]) => {
			const res = await authClient.signUp.email(opts);
			if (res?.error) {
				throw new Error(res.error.message || "Hesap oluşturulamadı");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error signing up with email:", error);
			toast.error(`Kayıt Hatası: ${error.message}`);
		},
		onSuccess() {
			toast.success(
				"Hesap başarıyla oluşturuldu. Lütfen e-posta adresinizi doğrulayın.",
			);
		},
	});
}

/**
 * Alias for useEmailSignUp
 */
export const useAuthSignUp = useEmailSignUp;

/**
 * Send OTP code to phone number
 * Used for new user phone verification
 */
export function usePhoneSendOtp() {
	return useMutation({
		mutationFn: async (
			opts: Parameters<typeof authClient.phoneNumber.sendOtp>[0],
		) => {
			const res = await authClient.phoneNumber.sendOtp(opts);
			if (res?.error) {
				throw new Error(res.error.message || "OTP gönderilemedi");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error sending OTP:", error);
			toast.error(`OTP Hatası: ${error.message}`);
		},
		onSuccess() {
			toast.success("Doğrulama kodu gönderildi");
		},
	});
}

/**
 * Verify OTP code for phone number
 * Used during new user registration flow
 */
export function usePhoneVerifyOtp() {
	return useMutation({
		mutationFn: async (
			opts: Parameters<typeof authClient.phoneNumber.verify>[0],
		) => {
			const res = await authClient.phoneNumber.verify(opts);
			if (res?.error) {
				throw new Error(res.error.message || "Kod doğrulanamadı");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error verifying OTP:", error);
			toast.error(`Doğrulama Hatası: ${error.message}`);
		},
		onSuccess() {
			toast.success("Telefon numarası doğrulandı");
		},
	});
}

/**
 * Sign in with phone number and password
 * Works for both new and existing users
 */
export function usePhoneSignIn() {
	return useMutation({
		mutationFn: async (
			opts: Parameters<typeof authClient.signIn.phoneNumber>[0],
		) => {
			const res = await authClient.signIn.phoneNumber(opts);
			if (res?.error) {
				throw new Error(res.error.message || "Giriş yapılamadı");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error signing in with phone:", error);
			toast.error(`Giriş Hatası: ${error.message}`);
		},
		onSuccess() {
			toast.success("Başarıyla giriş yapıldı");
		},
	});
}

/**
 * Update user profile information
 */
export function useUpdateUser() {
	return useMutation({
		mutationFn: async (opts: Parameters<typeof authClient.updateUser>[0]) => {
			const res = await authClient.updateUser(opts);
			if (res?.error) {
				throw new Error(res.error.message || "Güncelleme yapılamadı");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error updating user:", error);
			toast.error(`Güncelleme Hatası: ${error.message}`);
		},
		onSuccess() {
			toast.success("Bilgileriniz güncellendi");
		},
	});
}

/**
 * Change user email address
 */
export function useChangeEmail() {
	return useMutation({
		mutationFn: async (opts: { newEmail: string }) => {
			const res = await authClient.changeEmail(opts);
			if (res?.error) {
				throw new Error(res.error.message || "E-posta değiştirilemedi");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error changing email:", error);
			toast.error(`E-posta Hatası: ${error.message}`);
		},
		onSuccess() {
			toast.success(
				"E-posta değiştirme talebi alındı. Lütfen yeni adresinizi doğrulayın.",
			);
		},
	});
}

/**
 * Sign in with social provider (Google)
 */
export function useSocialSignIn() {
	return useMutation({
		mutationFn: async (
			opts: Parameters<typeof authClient.signIn.social>[0],
		) => {
			const res = await authClient.signIn.social(opts);
			if (res?.error) {
				throw new Error(res.error.message || "Giriş yapılamadı");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error signing in with social:", error);
			toast.error(`Giriş Hatası: ${error.message}`);
		},
	});
}

/**
 * Reset password using token
 */
export function useResetPassword() {
	return useMutation({
		mutationFn: async (
			opts: Parameters<typeof authClient.resetPassword>[0],
		) => {
			const res = await authClient.resetPassword(opts);
			if (res?.error) {
				throw new Error(res.error.message || "Şifre sıfırlanamadı");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error in reset password:", error);
			toast.error(`Sıfırlama Hatası: ${error.message}`);
		},
		onSuccess() {
			toast.success("Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.");
		},
	});
}

/**
 * Send OTP for Sign-in or Verification
 */
export function useSendEmailOtp() {
	return useMutation({
		mutationFn: async (
			opts: Parameters<typeof authClient.emailOtp.sendVerificationOtp>[0],
		) => {
			const res = await authClient.emailOtp.sendVerificationOtp(opts);
			if (res?.error) {
				throw new Error(res.error.message || "Kod gönderilemedi");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error sending email OTP:", error);
			toast.error(`Hata: ${error.message}`);
		},
		onSuccess() {
			toast.success("Doğrulama kodu e-posta adresinize gönderildi.");
		},
	});
}

/**
 * Verify Email using OTP
 */
export function useVerifyEmailOtp() {
	return useMutation({
		mutationFn: async (
			opts: Parameters<typeof authClient.emailOtp.verifyEmail>[0],
		) => {
			const res = await authClient.emailOtp.verifyEmail(opts);
			if (res?.error) {
				throw new Error(res.error.message || "E-posta doğrulanamadı");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error verifying email OTP:", error);
			toast.error(`Doğrulama Hatası: ${error.message}`);
		},
		onSuccess() {
			toast.success("E-posta adresiniz başarıyla doğrulandı.");
		},
	});
}

/**
 * Sign In using OTP
 */
export function useSignInEmailOtp() {
	return useMutation({
		mutationFn: async (
			opts: Parameters<typeof authClient.signIn.emailOtp>[0],
		) => {
			const res = await authClient.signIn.emailOtp(opts);
			if (res?.error) {
				throw new Error(res.error.message || "Giriş yapılamadı");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error signing in with OTP:", error);
			toast.error(`Giriş Hatası: ${error.message}`);
		},
		onSuccess() {
			toast.success("Başarıyla giriş yaptınız.");
		},
	});
}

/**
 * Request Password Reset using OTP
 */
export function useRequestPasswordResetOtp() {
	return useMutation({
		mutationFn: async (
			opts: Parameters<typeof authClient.emailOtp.requestPasswordReset>[0],
		) => {
			const res = await authClient.emailOtp.requestPasswordReset(opts);
			if (res?.error) {
				throw new Error(res.error.message || "Kod gönderilemedi");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error requesting password reset OTP:", error);
			toast.error(`Hata: ${error.message}`);
		},
		onSuccess() {
			toast.success("Şifre sıfırlama kodu e-posta adresinize gönderildi.");
		},
	});
}

/**
 * Reset Password using OTP
 */
export function useResetPasswordOtp() {
	return useMutation({
		mutationFn: async (
			opts: Parameters<typeof authClient.emailOtp.resetPassword>[0],
		) => {
			const res = await authClient.emailOtp.resetPassword(opts);
			if (res?.error) {
				throw new Error(res.error.message || "Şifre sıfırlanamadı");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error resetting password with OTP:", error);
			toast.error(`Sıfırlama Hatası: ${error.message}`);
		},
		onSuccess() {
			toast.success("Şifreniz başarıyla sıfırlandı.");
		},
	});
}

/**
 * Sign out the current user
 */
export function useSignOut() {
	return useMutation({
		mutationFn: async () => {
			const res = await authClient.signOut();
			if (res?.error) {
				throw new Error(res.error.message || "Çıkış yapılamadı");
			}
			return res?.data;
		},
		onError(error: Error) {
			console.error("Error signing out:", error);
			toast.error(`Çıkış Hatası: ${error.message}`);
		},
		onSuccess() {
			toast.success("Başarıyla çıkış yapıldı");
		},
	});
}
