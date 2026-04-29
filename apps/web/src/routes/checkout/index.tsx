import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AddressSelect } from "@/components/ui/address-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getUser } from "@/functions/get-user";
import { useCart } from "@/hooks/use-cart";
import {
	API_BASE_URL,
	type District,
	type Neighborhood,
	type Province,
	useDistricts,
	useNeighborhoods,
	useProvinces,
} from "@/hooks/use-turkish-address";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

const checkoutSchema = z.object({
	name: z.string().min(1, "Ad gereklidir"),
	surname: z.string().min(1, "Soyad gereklidir"),
	email: z.string().email("Geçerli bir e-posta adresi giriniz"),
	gsmNumber: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
	provinceId: z.string().min(1, "Şehir seçiniz"),
	districtId: z.string().min(1, "İlçe seçiniz"),
	neighborhoodId: z.string().min(1, "Mahalle seçiniz"),
	addressDetail: z.string().min(5, "Adres detayı en az 5 karakter olmalıdır"),
	zipCode: z.string().length(5, "Posta kodu 5 haneli olmalıdır"),
	city: z.string(),
	district: z.string(),
	neighborhood: z.string(),
	shippingCompany: z.enum(["DHL"]),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export const Route = createFileRoute("/checkout/")({
	validateSearch: z.object({
		error: z.string().optional(),
		orderId: z.string().optional(),
	}),
	component: CheckoutPage,
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({
				to: "/login",
			});
		}
		return { session };
	},
});

function CheckoutPage() {
	const { session } = Route.useRouteContext();
	const { error: errorParam } = Route.useSearch();
	const { items: cartItems, totalPrice: cartTotalPrice } = useCart();
	const [paymentPageUrl, setPaymentPageUrl] = useState<string | null>(null);
	const [isInitializing, setIsInitializing] = useState(false);
	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
		null,
	);
	const [saveAddress, setSaveAddress] = useState(true);
	const [showNewAddressForm, setShowNewAddressForm] = useState(false);
	const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
	const [couponCode, setCouponCode] = useState("");
	// biome-ignore lint/suspicious/noExplicitAny: <coupon type is not defined>
	const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
	const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

	useEffect(() => {
		if (errorParam) {
			const decodedError = decodeURIComponent(errorParam);
			const timer = setTimeout(() => {
				toast.error(decodedError, {
					duration: 5000,
				});
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [errorParam]);

	const queryClient = useQueryClient();

	const { data: publicSettings = {} } = useQuery({
		...orpc.settings.getPublicSettings.queryOptions(),
	});

	const items = cartItems;
	const totalPrice = cartTotalPrice;

	const createSessionMutation = useMutation(
		orpc.payment.createCheckoutSession.mutationOptions({
			onSuccess: (data) => {
				if (data.status === "success" && data.paymentPageUrl) {
					setPaymentPageUrl(data.paymentPageUrl);
				} else {
					toast.error(
						"Ödeme formu oluşturulamadı: " +
							(data.errorMessage || "Bilinmeyen hata"),
					);
				}
				setIsInitializing(false);
			},
			onError: (error) => {
				toast.error("Ödeme başlatılırken bir hata oluştu");
				console.error(error);
				setIsInitializing(false);
			},
		}),
	);

	const updateProfileMutation = useMutation(
		orpc.user.updateProfile.mutationOptions(),
	);

	const saveAddressMutation = useMutation(
		orpc.user.saveAddress.mutationOptions({
			onSuccess: (savedAddr) => {
				queryClient.invalidateQueries({
					queryKey: orpc.user.getAddresses.queryKey(),
				});
				if (showNewAddressForm) {
					setSelectedAddressId(savedAddr.id);
					setShowNewAddressForm(false);
					setEditingAddressId(null);
					toast.success("Adres başarıyla kaydedildi.");
				}
			},
			onError: (error) => {
				toast.error("Adres kaydedilirken bir hata oluştu");
				console.error(error);
			},
		}),
	);

	const handleSaveAddressFromDialog = () => {
		const values = form.state.values;
		saveAddressMutation.mutate({
			id: editingAddressId || undefined,
			title: `${values.city} - ${new Date().toLocaleDateString("tr-TR")}`,
			name: values.name,
			surname: values.surname,
			phone: values.gsmNumber,
			city: values.city,
			district: values.district,
			neighborhood: values.neighborhood,
			addressDetail: values.addressDetail,
			zipCode: values.zipCode,
		});
	};

	const isAnonymous = session?.user.isAnonymous;

	const form = useForm({
		defaultValues: {
			name: isAnonymous ? "" : session?.user.name.split(" ")[0] || "",
			surname: isAnonymous
				? ""
				: session?.user.name.split(" ").slice(1).join(" ") || "",
			gsmNumber: isAnonymous ? "" : session?.user.phoneNumber || "",
			email: isAnonymous ? "" : session?.user.email || "",
			addressDetail: "",
			provinceId: "",
			districtId: "",
			neighborhoodId: "",
			city: "",
			district: "",
			neighborhood: "",
			zipCode: "",
			shippingCompany: "DHL" as const,
		},
		validators: {
			onChange: checkoutSchema,
		},
		onSubmit: async ({ value }: { value: CheckoutValues }) => {
			handleCheckout(value);
		},
	});

	const { data: savedAddresses = [], isLoading: isAddressesLoading } = useQuery(
		{
			...orpc.user.getAddresses.queryOptions(),
			enabled: !!session?.user,
		},
	);

	const provinceId = useStore(form.store, (state) => state.values.provinceId);
	const districtId = useStore(form.store, (state) => state.values.districtId);

	const { data: provinces = [] } = useProvinces();
	const { data: districts = [], isLoading: isDistrictsLoading } =
		useDistricts(provinceId);
	const { data: neighborhoods = [], isLoading: isNeighborhoodsLoading } =
		useNeighborhoods(districtId);

	async function applySavedAddress(addr: {
		id: string;
		name: string;
		surname: string;
		phone: string;
		addressDetail: string;
		zipCode: string;
		city: string;
		district: string;
		neighborhood: string;
	}) {
		form.setFieldValue("name", addr.name);
		form.setFieldValue("surname", addr.surname);
		form.setFieldValue("gsmNumber", addr.phone);
		form.setFieldValue("addressDetail", addr.addressDetail);
		form.setFieldValue("zipCode", addr.zipCode);

		if (!provinces.length) return;

		const province = provinces.find(
			(p: Province) =>
				p.name.toLocaleLowerCase("tr-TR") ===
				addr.city.toLocaleLowerCase("tr-TR"),
		);
		if (!province) return;

		form.setFieldValue("provinceId", province.id.toString());
		form.setFieldValue("city", province.name);

		try {
			// Pre-fetch districts
			const dRes = await fetch(
				`${API_BASE_URL}/districts?provinceId=${province.id}`,
			);
			const dData = await dRes.json();
			const district = (dData.data as District[]).find(
				(d) =>
					d.name.toLocaleLowerCase("tr-TR") ===
					addr.district.toLocaleLowerCase("tr-TR"),
			);

			if (!district) return;
			form.setFieldValue("districtId", district.id.toString());
			form.setFieldValue("district", district.name);

			// Pre-fetch neighborhoods
			const nRes = await fetch(
				`${API_BASE_URL}/neighborhoods?districtId=${district.id}`,
			);
			const nData = await nRes.json();
			const neighborhood = (nData.data as Neighborhood[]).find(
				(n) =>
					n.name.toLocaleLowerCase("tr-TR") ===
					addr.neighborhood.toLocaleLowerCase("tr-TR"),
			);

			if (!neighborhood) return;
			form.setFieldValue("neighborhoodId", neighborhood.id.toString());
			form.setFieldValue("neighborhood", neighborhood.name);
			setSelectedAddressId(addr.id);
			setShowNewAddressForm(false);
		} catch (error) {
			console.error("Failed to apply full address details", error);
		}
	}

	const validateCouponMutation = useMutation(
		orpc.order.validateCoupon.mutationOptions({
			onSuccess: (coupon) => {
				setAppliedCoupon(coupon);
				toast.success("Kupon başarıyla uygulandı!");
				setIsValidatingCoupon(false);
			},
			onError: (error) => {
				toast.error(error.message || "Kupon doğrulanamadı");
				setAppliedCoupon(null);
				setIsValidatingCoupon(false);
			},
		}),
	);

	const handleApplyCoupon = () => {
		if (!couponCode) return;
		setIsValidatingCoupon(true);
		validateCouponMutation.mutate({
			code: couponCode,
			orderAmount: totalPrice,
		});
	};

	const shippingThreshold = Number.parseFloat(
		publicSettings.freeShippingThreshold || "500",
	);
	const currentFeeKey = "shipping_fee_dhl";
	const currentBaseFee = Number.parseFloat(
		publicSettings[currentFeeKey] || "250.00",
	);
	const shippingFee = totalPrice >= shippingThreshold ? 0 : currentBaseFee;
	let discountAmount = 0;
	if (appliedCoupon) {
		if (appliedCoupon.discountType === "percentage") {
			discountAmount = (totalPrice * appliedCoupon.discountAmount) / 100;
		} else {
			discountAmount = appliedCoupon.discountAmount;
		}
		discountAmount = Math.min(discountAmount, totalPrice);
	}
	const finalTotal = totalPrice + shippingFee - discountAmount;

	function handleEditAddress(addr: {
		id: string;
		name: string;
		surname: string;
		phone: string;
		addressDetail: string;
		zipCode: string;
		city: string;
		district: string;
		neighborhood: string;
	}) {
		setEditingAddressId(addr.id);
		form.setFieldValue("name", addr.name);
		form.setFieldValue("surname", addr.surname);
		form.setFieldValue("gsmNumber", addr.phone);
		form.setFieldValue("addressDetail", addr.addressDetail);
		form.setFieldValue("zipCode", addr.zipCode);
		form.setFieldValue("city", addr.city);
		form.setFieldValue("district", addr.district);
		form.setFieldValue("neighborhood", addr.neighborhood);

		const province = provinces.find((p) => p.name === addr.city);
		if (province) {
			form.setFieldValue("provinceId", province.id.toString());
		}

		setShowNewAddressForm(true);
	}

	function handleCheckout(formValues: CheckoutValues) {
		if (items.length === 0) {
			toast.error("Sepetiniz boş");
			return;
		}

		setIsInitializing(true);

		// 1. Update phone number in profile if different
		if (formValues.gsmNumber !== session.user.phoneNumber) {
			updateProfileMutation.mutate({ phone: formValues.gsmNumber });
		}

		// 2. Save address if requested
		if (saveAddress) {
			saveAddressMutation.mutate({
				id: editingAddressId || undefined,
				title: `${formValues.city} - ${new Date().toLocaleDateString("tr-TR")}`,
				name: formValues.name,
				surname: formValues.surname,
				phone: formValues.gsmNumber,
				city: formValues.city,
				district: formValues.district,
				neighborhood: formValues.neighborhood,
				addressDetail: formValues.addressDetail,
				zipCode: formValues.zipCode,
			});
		}

		const callbackUrl = `${window.location.origin}/api/iyzico-callback`;

		const fullAddr = [
			formValues.neighborhood,
			formValues.addressDetail,
			formValues.district,
			formValues.city,
		]
			.filter(Boolean)
			.join(", ");

		createSessionMutation.mutate({
			buyer: {
				id: session.user.id,
				name: formValues.name,
				surname: formValues.surname,
				gsmNumber: formValues.gsmNumber,
				email: formValues.email,
				identityNumber: "11111111111",
				lastLoginDate: `${new Date().toISOString().split("T")[0]} 10:00:00`,
				registrationDate: `${new Date().toISOString().split("T")[0]} 10:00:00`,
				registrationAddress: fullAddr,
				city: formValues.city,
				country: "Turkey",
				zipCode: formValues.zipCode,
			},
			shippingAddress: {
				name: formValues.name,
				surname: formValues.surname,
				email: formValues.email,
				gsmNumber: formValues.gsmNumber,
				province: formValues.city,
				district: formValues.district,
				neighborhood: formValues.neighborhood,
				addressDetail: formValues.addressDetail,
				zipCode: formValues.zipCode,
			},
			callbackUrl,
			shippingCompany: formValues.shippingCompany,
			couponCode: appliedCoupon?.code,
		});
	}

	if (paymentPageUrl) {
		return (
			<div className="container mx-auto min-h-screen px-4 py-10">
				<Card className="mx-auto max-w-4xl">
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Ödeme Yap</CardTitle>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setPaymentPageUrl(null)}
						>
							Vazgeç
						</Button>
					</CardHeader>
					<CardContent className="p-0">
						<iframe
							src={`${paymentPageUrl}&iframe=true`}
							title="Iyzico Checkout"
							className="min-h-[700px] w-full border-0"
						/>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto min-h-screen max-w-7xl px-4 py-8">
			<h1 className="mb-8 border-b pb-4 font-semibold text-2xl">
				Bir teslimat adresi seçin
			</h1>

			<div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_350px]">
				{/* Left Column: Address Selection */}
				<div className="space-y-8">
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<h2 className="font-bold text-xl">
								Teslimat adresleri ({savedAddresses.length})
							</h2>
						</div>

						{isAddressesLoading ? (
							<div className="space-y-4">
								{[1, 2].map((i) => (
									<div
										key={i}
										className="flex items-start gap-4 rounded-xl border-2 border-muted bg-card p-4"
									>
										<Skeleton className="mt-1 h-4 w-4 shrink-0 rounded-full" />
										<div className="flex-1 space-y-3">
											<Skeleton className="h-5 w-1/3" />
											<Skeleton className="h-4 w-full" />
											<Skeleton className="h-4 w-2/3" />
											<div className="flex gap-4 pt-2">
												<Skeleton className="h-4 w-24" />
											</div>
										</div>
									</div>
								))}
							</div>
						) : savedAddresses.length > 0 ? (
							<RadioGroup
								value={selectedAddressId || ""}
								onValueChange={(id) => {
									const addr = savedAddresses.find((a) => a.id === id);
									if (addr) applySavedAddress(addr);
								}}
								className="space-y-4"
							>
								{savedAddresses.map((addr) => (
									<button
										type="button"
										key={addr.id}
										className={cn(
											"relative flex w-full cursor-pointer items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
											selectedAddressId === addr.id
												? "border-primary bg-primary/5 ring-1 ring-primary/20"
												: "border-muted bg-card hover:border-muted-foreground/30",
										)}
										onClick={() => applySavedAddress(addr)}
									>
										<RadioGroupItem
											value={addr.id}
											id={addr.id}
											className="mt-1"
										/>
										<div className="flex-1 space-y-1">
											<Label
												htmlFor={addr.id}
												className="cursor-pointer font-bold text-base"
											>
												{addr.name} {addr.surname}
											</Label>
											<p className="text-muted-foreground text-sm leading-relaxed">
												{addr.addressDetail}, {addr.neighborhood}
												<br />
												{addr.district}, {addr.city}, {addr.zipCode}, Türkiye
											</p>
											<div className="flex flex-wrap gap-4 pt-2 font-medium text-primary text-xs">
												<button
													type="button"
													className="hover:underline"
													onClick={(e) => {
														e.stopPropagation();
														handleEditAddress(addr);
													}}
												>
													Adresi düzenle
												</button>
											</div>
										</div>
									</button>
								))}
							</RadioGroup>
						) : (
							<div className="space-y-4 rounded-xl border-2 border-dashed bg-muted/20 p-8 text-center">
								<p className="text-muted-foreground">
									Henüz kayıtlı bir adresiniz bulunmuyor.
								</p>
							</div>
						)}

						<Button
							variant="link"
							className="h-auto px-0 font-semibold text-primary"
							onClick={() => {
								setEditingAddressId(null);
								form.reset();
								setShowNewAddressForm(true);
							}}
						>
							+ Yeni bir teslimat adresi ekleyin
						</Button>
					</div>

					<Separator />

					{/* Kargo Seçimi Section */}
					<div className="space-y-6">
						<h2 className="font-bold text-xl">Kargo Firması</h2>
						<form.Field name="shippingCompany">
							{(field) => (
								<RadioGroup
									value={field.state.value}
									onValueChange={(val) => field.handleChange(val)}
									className="grid grid-cols-1 gap-4 sm:grid-cols-2"
								>
									<button
										type="button"
										className={cn(
											"relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-6 transition-all",
											field.state.value === "DHL"
												? "border-primary bg-primary/5 ring-1 ring-primary/20"
												: "border-muted bg-card hover:border-muted-foreground/30",
										)}
										onClick={() => field.handleChange("DHL")}
									>
										<RadioGroupItem value="DHL" id="DHL" className="sr-only" />
										<img
											src="https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg"
											alt="DHL Kargo"
											className="mb-2 h-8 object-contain"
										/>
										<span className="font-bold text-muted-foreground text-xs">
											DHL Kargo
										</span>
									</button>
								</RadioGroup>
							)}
						</form.Field>
					</div>
				</div>

				{/* Right Column: Sidebar */}
				<div className="lg:relative">
					<div className="sticky top-8 space-y-6">
						<div className="space-y-6 bg-stone-50/50 p-6 md:p-8">
							<div className="space-y-6">
								<h3 className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
									Sipariş Özeti
								</h3>

								{/* Items Summary in Sidebar */}
								<div className="space-y-6">
									{items.map((item) => {
										const name = item.name;
										const image = item.image;
										const price = item.price;
										const quantity = item.quantity;
										const color = item.color;
										const size = item.size;

										return (
											<div
												key={`${item.id}-${item.size}-${item.color}`}
												className="group flex gap-4"
											>
												<div className="relative h-20 w-16 shrink-0 overflow-hidden bg-white shadow-sm">
													<img
														src={image}
														alt={name}
														className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
													/>
													<div className="absolute top-0 right-0">
														<span className="flex h-5 w-5 items-center justify-center bg-black/90 font-bold text-[10px] text-white">
															{quantity}
														</span>
													</div>
												</div>
												<div className="flex min-w-0 flex-1 flex-col justify-start pt-1">
													<div className="space-y-1">
														<span className="line-clamp-1 block pt-1 font-medium text-[11px] text-foreground uppercase leading-tight tracking-wide">
															{name}
														</span>
														<div className="flex gap-2">
															{size && (
																<span className="text-[9px] text-muted-foreground uppercase tracking-widest">
																	{size}
																</span>
															)}
															{color && (
																<span className="text-[9px] text-muted-foreground uppercase tracking-widest">
																	{color}
																</span>
															)}
														</div>
													</div>
													<div className="mt-auto">
														<p className="font-bold text-foreground text-sm tracking-tight">
															{new Intl.NumberFormat("tr-TR", {
																style: "currency",
																currency: "TRY",
															}).format(price * quantity)}
														</p>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>

							<div className="h-px bg-stone-200" />

							<div className="space-y-4">
								<div className="flex justify-between font-medium text-stone-500 text-xs tracking-wide">
									<span>Ürünler:</span>
									<span>
										{new Intl.NumberFormat("tr-TR", {
											style: "currency",
											currency: "TRY",
										}).format(totalPrice)}
									</span>
								</div>
								<div className="flex justify-between font-medium text-stone-500 text-xs tracking-wide">
									<span>Kargo ve Paketleme:</span>
									<span
										className={cn(
											shippingFee === 0 && "line-through opacity-50",
										)}
									>
										{new Intl.NumberFormat("tr-TR", {
											style: "currency",
											currency: "TRY",
										}).format(currentBaseFee)}
									</span>
								</div>
								{shippingFee === 0 && (
									<div className="flex justify-between font-bold text-[10px] text-emerald-600 uppercase tracking-widest">
										<span>Kargo Bedava</span>
										<span>0,00 ₺</span>
									</div>
								)}
								{discountAmount > 0 && (
									<div className="flex justify-between font-bold text-emerald-600 text-xs">
										<span>İndirim ({appliedCoupon?.code}):</span>
										<span>
											-
											{new Intl.NumberFormat("tr-TR", {
												style: "currency",
												currency: "TRY",
											}).format(discountAmount)}
										</span>
									</div>
								)}

								<div className="pt-2">
									{!appliedCoupon ? (
										<div className="flex items-center gap-2 border-stone-200 border-b pb-1 transition-colors focus-within:border-primary">
											<Input
												placeholder="İndirim Kodu"
												value={couponCode}
												onChange={(e) => setCouponCode(e.target.value)}
												className="h-8 border-0 bg-transparent px-0 text-[11px] uppercase tracking-widest shadow-none focus-visible:ring-0"
											/>
											<Button
												variant="ghost"
												size="sm"
												className="h-8 rounded-none px-2 font-bold text-[10px] uppercase tracking-widest transition-colors hover:bg-stone-100"
												onClick={handleApplyCoupon}
												disabled={!couponCode || isValidatingCoupon}
											>
												{isValidatingCoupon ? (
													<Loader2 className="h-3 w-3 animate-spin" />
												) : (
													"Uygula"
												)}
											</Button>
										</div>
									) : (
										<div className="flex items-center justify-between border-emerald-100 bg-emerald-50/30 p-2">
											<div className="flex flex-col">
												<span className="font-bold text-[8px] text-emerald-600 uppercase tracking-widest">
													Aktif Kupon
												</span>
												<span className="font-bold text-[10px] text-emerald-700 uppercase tracking-widest">
													{appliedCoupon.code}
												</span>
											</div>
											<button
												type="button"
												className="font-bold text-[10px] text-stone-400 uppercase tracking-widest transition-colors hover:text-red-500"
												onClick={() => {
													setAppliedCoupon(null);
													setCouponCode("");
												}}
											>
												Kaldır
											</button>
										</div>
									)}
								</div>

								<div className="pt-6">
									<div className="flex flex-col gap-1">
										<span className="font-bold text-[10px] text-stone-400 uppercase tracking-[0.2em]">
											Sipariş Toplamı:
										</span>
										<span className="font-bold text-2xl text-stone-900 tracking-tight">
											{new Intl.NumberFormat("tr-TR", {
												style: "currency",
												currency: "TRY",
											}).format(finalTotal)}
										</span>
									</div>
								</div>
							</div>

							<Separator className="my-4" />

							<div className="space-y-4">
								<form.Subscribe>
									{(state) => (
										<Button
											className="h-14 w-full rounded-xl font-bold text-base shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
											size="lg"
											onClick={() => form.handleSubmit()}
											disabled={
												isInitializing ||
												!selectedAddressId ||
												items.length === 0 ||
												!state.canSubmit
											}
										>
											{isInitializing ? (
												<>
													<Loader2 className="mr-2 h-5 w-5 animate-spin" />
													Hazırlanıyor...
												</>
											) : (
												"Bu adrese teslim et"
											)}
										</Button>
									)}
								</form.Subscribe>

								<div className="px-2 text-center font-medium text-[10px] text-stone-400 uppercase leading-relaxed tracking-wider">
									Siparişi onaylayarak{" "}
									<button type="button" className="font-bold underline">
										satış sözleşmesini
									</button>{" "}
									kabul etmiş olursunuz.
								</div>
							</div>

							<div className="rounded-xl border border-muted-foreground/10 bg-muted/20 p-4 font-medium text-[11px] text-muted-foreground leading-relaxed">
								Sipariş Toplamlarına KDV dahildir.{" "}
								<button
									type="button"
									className="font-bold text-primary hover:underline"
								>
									Detayları gör
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Dialog
				open={showNewAddressForm}
				onOpenChange={(open) => {
					setShowNewAddressForm(open);
					if (!open) setEditingAddressId(null);
				}}
			>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle className="font-bold text-2xl">
							{editingAddressId
								? "Teslimat adresini düzenleyin"
								: "Yeni bir teslimat adresi girin"}
						</DialogTitle>
						<DialogDescription>
							Lütfen kargonuzun ulaşabilmesi için tüm alanları eksiksiz
							doldurun.
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-6 py-4"
					>
						<div className="grid grid-cols-2 gap-4">
							<form.Field name="name">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor="name">Ad</Label>
										<Input
											id="name"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											className="h-11 shadow-sm"
										/>
										<FieldError errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
							<form.Field name="surname">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor="surname">Soyad</Label>
										<Input
											id="surname"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											className="h-11 shadow-sm"
										/>
										<FieldError errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="gsmNumber">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="phone">Teslimat için cep telefonu</Label>
									<Input
										id="phone"
										value={field.state.value}
										placeholder="(5xx-xxx-xxxx)"
										onChange={(e) => field.handleChange(e.target.value)}
										className="h-11 shadow-sm"
									/>
									<p className="font-medium text-[10px] text-muted-foreground">
										Teslimata yardımcı olmak için kullanılabilir.
									</p>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>

						<form.Field name="email">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="email">E-posta Adresi</Label>
									<Input
										id="email"
										type="email"
										value={field.state.value}
										placeholder="e-posta@örnek.com"
										onChange={(e) => field.handleChange(e.target.value)}
										className="h-11 shadow-sm"
									/>
									<p className="font-medium text-[10px] text-muted-foreground">
										Sipariş onayınız ve kargo bilgileriniz bu adrese
										gönderilecektir.
									</p>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>

						<div className="grid grid-cols-2 gap-4">
							<form.Field name="provinceId">
								{(field) => (
									<div className="space-y-2">
										<Label>Şehir</Label>
										<AddressSelect
											items={provinces.map((p: Province) => ({
												id: p.id.toString(),
												name: p.name,
											}))}
											value={field.state.value}
											placeholder="Şehir seçin"
											onSelect={(id: string, name: string) => {
												field.handleChange(id);
												form.setFieldValue("city", name);
												form.setFieldValue("districtId", "");
												form.setFieldValue("district", "");
												form.setFieldValue("neighborhoodId", "");
												form.setFieldValue("neighborhood", "");
											}}
										/>
										<FieldError errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="districtId">
								{(field) => (
									<div className="space-y-2">
										<Label>İlçe</Label>
										<AddressSelect
											items={districts.map((d: District) => ({
												id: d.id.toString(),
												name: d.name,
											}))}
											value={field.state.value}
											placeholder="İlçe seçin"
											onSelect={(id: string, name: string) => {
												field.handleChange(id);
												form.setFieldValue("district", name);
												form.setFieldValue("neighborhoodId", "");
												form.setFieldValue("neighborhood", "");
											}}
											disabled={!provinceId || isDistrictsLoading}
										/>
										<FieldError errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="neighborhoodId">
							{(field) => (
								<div className="space-y-2">
									<Label>Mahalle</Label>
									<AddressSelect
										items={neighborhoods.map((n: Neighborhood) => ({
											id: n.id.toString(),
											name: n.name,
										}))}
										value={field.state.value}
										placeholder="Mahalle seçin"
										onSelect={(id: string, name: string) => {
											field.handleChange(id);
											form.setFieldValue("neighborhood", name);
										}}
										disabled={!districtId || isNeighborhoodsLoading}
									/>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>

						<form.Field name="addressDetail">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="address">Adres satırı 1</Label>
									<Input
										id="address"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Açık adres, P.O. kutusu, şirket adı, c/o"
										className="h-11 shadow-sm"
									/>
									<Input
										placeholder="Apartman, daire, ünite, bina, kat vb."
										className="mt-2 h-11 shadow-sm"
									/>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>

						<form.Field name="zipCode">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="zip">Posta kodu</Label>
									<Input
										id="zipc"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="34000"
										className="h-11 shadow-sm"
									/>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>

						<div className="flex items-center space-x-2 pt-2">
							<input
								type="checkbox"
								id="dialog-save-address"
								checked={saveAddress}
								onChange={(e) => setSaveAddress(e.target.checked)}
								className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
							/>
							<Label
								htmlFor="dialog-save-address"
								className="cursor-pointer font-medium text-sm"
							>
								Bunu varsayılan adresim yap
							</Label>
						</div>

						<Button
							type="button"
							className="h-12 w-full font-bold text-base shadow-md"
							disabled={saveAddressMutation.isPending}
							onClick={handleSaveAddressFromDialog}
						>
							{saveAddressMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Kaydediliyor...
								</>
							) : editingAddressId ? (
								"Adresi Güncelle"
							) : (
								"Adresi Kaydet ve Kullan"
							)}
						</Button>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
