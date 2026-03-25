import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import type { ShopCart } from '../types/shop';
import { checkoutShop, getShopCart } from '../services/shopApi';
import { useAuth } from '../context/AuthContext';
import { AuthRequiredPrompt } from '../components/AuthRequiredPrompt';
import { goToAuth } from '../navigation/navigationRef';
import type { ShopStackParamList } from '../navigation/MainTabNavigator';

type PaymentMethod = 'simulated-card' | 'cash-on-delivery';

export function CheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList, 'Checkout'>>();
  const { user } = useAuth();
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('simulated-card');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardName, setCardName] = useState('Demo User');
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvv, setCardCvv] = useState('123');
  const [shipName, setShipName] = useState('');
  const [shipPhone, setShipPhone] = useState('');
  const [shipLine1, setShipLine1] = useState('');
  const [shipLine2, setShipLine2] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipPostal, setShipPostal] = useState('');
  const [shipCountry, setShipCountry] = useState('US');

  useEffect(() => {
    if (user) {
      setShipName(user.fullName || '');
      setShipPhone(user.phone || '');
      setShipLine1(user.addressLine1 || '');
      setShipLine2(user.addressLine2 || '');
      setShipCity(user.city || '');
      setShipPostal(user.postalCode || '');
      setShipCountry(user.country || 'US');
    }
  }, [user]);

  const load = useCallback(async () => {
    try {
      const data = await getShopCart();
      setCart(data);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Checkout unavailable', text2: (e as Error)?.message });
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else setCart(null);
  }, [user, load]);

  const isCardValid = () => {
    const digits = cardNumber.replace(/\s/g, '');
    const expiryOk = /^\d{2}\/\d{2}$/.test(cardExpiry.trim());
    const cvvOk = /^\d{3,4}$/.test(cardCvv.trim());
    const nameOk = cardName.trim().length >= 2;
    return digits.length >= 12 && digits.length <= 19 && expiryOk && cvvOk && nameOk;
  };

  const placeOrder = async () => {
    if (paymentMethod === 'simulated-card' && !isCardValid()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid card details',
        text2: 'Check number, expiry, CVV, and cardholder name.',
      });
      return;
    }

    if (!shipName.trim() || !shipPhone.trim() || !shipLine1.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Shipping details',
        text2: 'Name, phone, and address are required for your order.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const order = await checkoutShop(paymentMethod, {
        shippingName: shipName.trim(),
        shippingPhone: shipPhone.trim(),
        shippingLine1: shipLine1.trim(),
        shippingLine2: shipLine2.trim(),
        shippingCity: shipCity.trim(),
        shippingPostalCode: shipPostal.trim(),
        shippingCountry: shipCountry.trim() || 'US',
      });
      navigation.navigate('OrderPaid', { orderId: order.id });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Checkout failed', text2: (e as Error)?.message });
    } finally {
      setSubmitting(false);
    }
  };

  const items = cart?.items ?? [];

  if (!user) {
    return (
      <AuthRequiredPrompt
        title="Sign in to checkout"
        subtitle="Complete your purchase after you sign in."
        onSignIn={() => goToAuth(navigation)}
      />
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.duration(250)}>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>Checkout</Text>
          <Text style={styles.subtitle}>Confirm shipping and payment.</Text>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(40).duration(250)}>
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Shipping</Text>
          <Text style={styles.hint}>Used on your order confirmation. Edit if needed.</Text>
          <TextInput
            value={shipName}
            onChangeText={setShipName}
            placeholder="Full name"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TextInput
            value={shipPhone}
            onChangeText={setShipPhone}
            keyboardType="phone-pad"
            placeholder="Phone"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TextInput
            value={shipLine1}
            onChangeText={setShipLine1}
            placeholder="Address line 1"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TextInput
            value={shipLine2}
            onChangeText={setShipLine2}
            placeholder="Address line 2 (optional)"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TextInput
            value={shipCity}
            onChangeText={setShipCity}
            placeholder="City"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TextInput
            value={shipPostal}
            onChangeText={setShipPostal}
            placeholder="Postal code"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TextInput
            value={shipCountry}
            onChangeText={setShipCountry}
            placeholder="Country"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { marginBottom: 0 }]}
          />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(250)}>
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.length ? (
            items.map((item) => (
              <View key={item.id} style={styles.row}>
                <Text style={styles.rowLabel}>{item.product.name} x{item.quantity}</Text>
                <Text style={styles.rowValue}>${item.lineTotal.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>Your cart is empty.</Text>
          )}
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(250)}>
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Payment method</Text>

          <View style={styles.paymentChoiceRow}>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'simulated-card' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('simulated-card')}
            >
              <Ionicons
                name="card-outline"
                size={18}
                color={paymentMethod === 'simulated-card' ? colors.textOnOlive : colors.olive}
              />
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === 'simulated-card' && styles.paymentOptionTextActive,
                ]}
              >
                Credit Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'cash-on-delivery' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('cash-on-delivery')}
            >
              <Ionicons
                name="cash-outline"
                size={18}
                color={paymentMethod === 'cash-on-delivery' ? colors.textOnOlive : colors.olive}
              />
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === 'cash-on-delivery' && styles.paymentOptionTextActive,
                ]}
              >
                Cash on Delivery
              </Text>
            </TouchableOpacity>
          </View>

          {paymentMethod === 'simulated-card' ? (
            <View style={styles.cardForm}>
              <View style={styles.paymentPill}>
                <Text style={styles.paymentText}>Enter your card details to place the order.</Text>
              </View>
              <TextInput
                value={cardNumber}
                onChangeText={setCardNumber}
                style={styles.input}
                placeholder="Card number"
                keyboardType="number-pad"
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                value={cardName}
                onChangeText={setCardName}
                style={styles.input}
                placeholder="Cardholder name"
                placeholderTextColor={colors.textSecondary}
              />
              <View style={styles.rowInputs}>
                <TextInput
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                  style={[styles.input, styles.inputHalf]}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  value={cardCvv}
                  onChangeText={setCardCvv}
                  style={[styles.input, styles.inputHalf]}
                  placeholder="CVV"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          ) : (
            <View style={styles.paymentPill}>
              <Text style={styles.paymentText}>Pay with cash when your order arrives.</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${(cart?.total ?? 0).toFixed(2)}</Text>
          </View>

          <GradientButton
            title={paymentMethod === 'simulated-card' ? 'Pay now' : 'Place COD order'}
            onPress={placeOrder}
            loading={submitting}
            disabled={!items.length || submitting}
          />
        </GlassCard>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 20, paddingBottom: 40 },
  card: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { marginTop: 6, color: colors.textSecondary },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 10 },
  rowLabel: { flex: 1, color: colors.textPrimary },
  rowValue: { color: colors.olive, fontWeight: '700' },
  paymentPill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.card,
    marginBottom: 12,
  },
  paymentText: { color: colors.textPrimary, fontWeight: '600' },
  paymentChoiceRow: { gap: 8, marginBottom: 12 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  paymentOptionActive: {
    backgroundColor: colors.olive,
    borderColor: colors.olive,
  },
  paymentOptionText: { color: colors.textPrimary, fontWeight: '600' },
  paymentOptionTextActive: { color: colors.textOnOlive },
  cardForm: { marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 8 : 10,
    marginBottom: 8,
  },
  rowInputs: { flexDirection: 'row', gap: 8 },
  inputHalf: { flex: 1 },
  totalLabel: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' },
  totalValue: { fontSize: 20, color: colors.olive, fontWeight: '700' },
  empty: { color: colors.textSecondary },
  hint: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
});
