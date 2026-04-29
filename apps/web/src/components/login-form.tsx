import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	useSendEmailOtp,
	useSignInEmailOtp,
	useSocialSignIn,
} from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const emailSchema = z.object({
	email: z.string().email("Geçerli bir e-posta adresi giriniz"),
});

const otpSchema = z.object({
	otp: z.string().length(6, "Doğrulama kodu 6 haneli olmalıdır"),
});

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"form">) {
	const navigate = useNavigate();
	const [step, setStep] = useState<"email" | "otp">("email");
	const [userEmail, setUserEmail] = useState("");

	const { mutateAsync: sendOtp, isPending: isSending } = useSendEmailOtp();
	const { mutateAsync: signInOtp, isPending: isVerifying } =
		useSignInEmailOtp();
	const { mutateAsync: socialSignIn, isPending: isSocialPending } =
		useSocialSignIn();

	const handleSocialSignIn = async () => {
		try {
			await socialSignIn({
				provider: "google",
				callbackURL: "/",
			});
		} catch (error) {
			console.error("Social sign in error:", error);
		}
	};

	const emailForm = useForm({
		defaultValues: { email: "" },
		validators: { onChange: emailSchema },
		onSubmit: async ({ value }) => {
			try {
				await sendOtp({
					email: value.email,
					type: "sign-in", // Uses the sign-in template defined in our better-auth config
				});
				setUserEmail(value.email);
				setStep("otp");
			} catch {
				// Handled by mutation hook
			}
		},
	});

	const otpForm = useForm({
		defaultValues: { otp: "" },
		validators: { onChange: otpSchema },
		onSubmit: async ({ value }) => {
			try {
				await signInOtp({
					email: userEmail,
					otp: value.otp,
				});
				navigate({ to: "/" });
			} catch {
				// Handled by mutation hook
			}
		},
	});

	if (step === "otp") {
		return (
			<form
				className={cn("flex flex-col gap-6", className)}
				{...props}
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					otpForm.handleSubmit();
				}}
			>
				<FieldGroup className="gap-8">
					<div className="mb-2 text-center sm:text-left">
						<p className="text-muted-foreground text-sm">
							<span className="font-medium text-foreground">{userEmail}</span>{" "}
							adresine 6 haneli bir doğrulama kodu gönderdik. Lütfen kodu
							aşağıya girin.
						</p>
					</div>

					<div className="grid gap-6">
						<otpForm.Field name="otp">
							{(field) => (
								<Field className="gap-2">
									<FieldLabel className="font-medium text-sm">
										Doğrulama Kodu
									</FieldLabel>
									<Input
										id="otp"
										type="text"
										inputMode="numeric"
										maxLength={6}
										placeholder="123456"
										required
										className="h-11 rounded-none border-0 border-border border-b bg-secondary/30 px-3 text-center font-mono text-lg tracking-widest transition-all focus-visible:border-primary focus-visible:bg-secondary/50 focus-visible:ring-0"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => {
											const val = e.target.value.replace(/\D/g, "");
											field.handleChange(val);
										}}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</otpForm.Field>
					</div>

					<div className="grid gap-4">
						<Button
							type="submit"
							size="lg"
							disabled={isVerifying}
							className="h-12 rounded-none bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
						>
							{isVerifying ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Doğrula ve Giriş Yap
						</Button>

						<Button
							variant="ghost"
							type="button"
							onClick={() => setStep("email")}
							className="h-12 rounded-none text-muted-foreground"
							disabled={isVerifying}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Geri Dön
						</Button>
					</div>
				</FieldGroup>
			</form>
		);
	}

	return (
		<form
			className={cn("flex flex-col gap-6", className)}
			{...props}
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				emailForm.handleSubmit();
			}}
		>
			<FieldGroup className="gap-8">
				<div className="grid gap-6">
					<emailForm.Field name="email">
						{(field) => (
							<Field className="gap-2">
								<FieldLabel className="font-medium text-sm">E-posta</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="ornek@ebru.com"
									required
									className="h-11 rounded-none border-0 border-border border-b bg-secondary/30 px-3 transition-all focus-visible:border-primary focus-visible:bg-secondary/50 focus-visible:ring-0"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</emailForm.Field>
				</div>

				<div className="grid gap-4">
					<Button
						type="submit"
						size="lg"
						disabled={isSending || isSocialPending}
						className="h-12 rounded-none bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
					>
						{isSending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : null}
						Giriş Yap
					</Button>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-border/50 border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-4 text-muted-foreground">
								Veya şununla devam et
							</span>
						</div>
					</div>

					<Button
						variant="outline"
						type="button"
						size="lg"
						className="h-12 rounded-none border-border/50 transition-all hover:bg-secondary"
						onClick={handleSocialSignIn}
						disabled={isSending || isSocialPending}
					>
						{isSocialPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
								<title>Google</title>
								<path
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									fill="#4285F4"
								/>
								<path
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									fill="#34A853"
								/>
								<path
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
									fill="#FBBC05"
								/>
								<path
									d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
									fill="#EA4335"
								/>
							</svg>
						)}
						Google ile Bağlan
					</Button>
				</div>

				<p className="text-center text-muted-foreground text-sm">
					Hesabınız yok mu?{" "}
					<a
						href="/signup"
						className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
					>
						Kayıt ol
					</a>
				</p>
			</FieldGroup>
		</form>
	);
}
