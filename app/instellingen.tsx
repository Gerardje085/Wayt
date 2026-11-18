import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useThema } from '../src/context/ThemeContext';
import {
  getDefaultRestTime,
  setDefaultRestTime,
  STANDAARD_RUST_TIJD,
} from '../src/lib/settingsStore';
import { RADIUS, SPACING, useResponsive } from '../src/theme/designTokens';
import ResponsiveContainer from '../src/components/ui/ResponsiveContainer';
import ScreenHeader from '../src/components/ui/ScreenHeader';
import Card from '../src/components/ui/Card';
import BottomSheet from '../src/components/ui/BottomSheet';
import PrimaryButton from '../src/components/ui/PrimaryButton';

const RUST_PRESETS = [
  { label: '60s', seconden: 60 },
  { label: '90s', seconden: 90 },
  { label: '120s', seconden: 120 },
  { label: '180s', seconden: 180 },
];

const THEMA_OPTIES: Array<{
  id: 'donker' | 'licht' | 'systeem';
  label: string;
  sub: string;
  icoon: keyof typeof Ionicons.glyphMap;
  previewBg: string;
  previewCard: string;
}> = [
  {
    id: 'donker',
    label: 'Donker',
    sub: 'Zinc Dark',
    icoon: 'moon',
    previewBg: '#09090B',
    previewCard: '#18181B',
  },
  {
    id: 'licht',
    label: 'Licht',
    sub: 'Helder wit',
    icoon: 'sunny',
    previewBg: '#F4F4F5',
    previewCard: '#FFFFFF',
  },
  {
    id: 'systeem',
    label: 'Systeem',
    sub: 'Automatisch',
    icoon: 'contrast',
    previewBg: '#18181B',
    previewCard: '#E4E4E7',
  },
];

export default function InstellingenScreen() {
  const { user, profile, uitloggen } = useAuth();
  const { kleuren, voorkeur, setVoorkeur } = useThema();
  const { contentPadding } = useResponsive();
  const router = useRouter();

  const [standaardRust, setStandaardRust] = useState(STANDAARD_RUST_TIJD);
  const [customRustModal, setCustomRustModal] = useState(false);
  const [customRustInput, setCustomRustInput] = useState('');
  const [customFout, setCustomFout] = useState<string | null>(null);

  const webPointer: ViewStyle | undefined =
    Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

  useEffect(() => {
    getDefaultRestTime().then(setStandaardRust);
  }, []);

  const handleKiesRust = async (sec: number) => {
    setStandaardRust(sec);
    await setDefaultRestTime(sec);
  };

  const handleCustomRustOpslaan = async () => {
    const val = parseInt(customRustInput.trim(), 10);
    if (isNaN(val) || val < 10 || val > 600) {
      setCustomFout('Voer een rusttijd tussen 10 en 600 seconden in.');
      return;
    }
    setCustomFout(null);
    setStandaardRust(val);
    await setDefaultRestTime(val);
    setCustomRustModal(false);
  };

  const isCustomActief = !RUST_PRESETS.some((p) => p.seconden === standaardRust);
  const gebruikersnaam = profile?.username?.trim() || 'Gebruiker';
  const emailAdres = user?.email ?? '—';
  const initiaal = (profile?.username?.trim()?.[0] || user?.email?.[0] || 'W').toUpperCase();

  const terugKnop = (
    <TouchableOpacity
      style={[
        stijlen.terugKnop,
        { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand },
        webPointer,
      ]}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
      accessibilityLabel="Terug naar dashboard"
    >
      <Ionicons name="arrow-back" size={20} color={kleuren.tekst} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[stijlen.veilig, { backgroundColor: kleuren.achtergrond }]} edges={['top']}>
      <ScrollView
        style={stijlen.scroll}
        contentContainerStyle={[
          stijlen.inhoud,
          { paddingHorizontal: contentPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer variant="narrow">
          <ScreenHeader
            title="Instellingen"
            subtitle="Rusttijd, weergave en account"
            leftAction={terugKnop}
          />

          {/* Account Header Kaart */}
          <Card padding={18} style={stijlen.sectieKaart}>
            <View style={stijlen.accountRij}>
              <View
                style={[
                  stijlen.avatarCirkel,
                  {
                    backgroundColor: kleuren.accentGedimpt,
                    borderColor: kleuren.accent + '44',
                  },
                ]}
              >
                <Text style={[stijlen.avatarInitiaal, { color: kleuren.accentLicht }]}>
                  {initiaal}
                </Text>
              </View>

              <View style={stijlen.accountTekstBlok}>
                <Text style={[stijlen.accountNaam, { color: kleuren.tekst }]} numberOfLines={1}>
                  {gebruikersnaam}
                </Text>
                <Text
                  style={[stijlen.accountEmail, { color: kleuren.tekstSecundair }]}
                  numberOfLines={1}
                >
                  {emailAdres}
                </Text>
              </View>

              <View
                style={[
                  stijlen.statusBadge,
                  {
                    backgroundColor: kleuren.achtergrondSecundair,
                    borderColor: kleuren.kaartRand,
                  },
                ]}
              >
                <View style={[stijlen.statusDot, { backgroundColor: kleuren.succes }]} />
                <Text style={[stijlen.statusTekst, { color: kleuren.tekstSecundair }]}>Actief</Text>
              </View>
            </View>
          </Card>

          {/* Standaard Rusttijd */}
          <Text style={[stijlen.sectie, { color: kleuren.tekstSecundair }]}>
            STANDAARD RUSTTIJD TUSSEN SETS
          </Text>
          <Card padding={18} style={stijlen.sectieKaart}>
            <View style={stijlen.kaartHeaderRij}>
              <View style={[stijlen.sectieIcoonBadge, { backgroundColor: kleuren.accentGedimpt }]}>
                <Ionicons name="timer-outline" size={18} color={kleuren.accentLicht} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[stijlen.kaartTitel, { color: kleuren.tekst }]}>
                  Standaard rustduur: {standaardRust}s
                </Text>
                <Text style={[stijlen.kaartUitleg, { color: kleuren.tekstSecundair }]}>
                  Wordt automatisch ingevuld bij nieuwe oefeningen in routines en live workouts.
                </Text>
              </View>
            </View>

            <View style={stijlen.rustKnoppenRij}>
              {RUST_PRESETS.map((p) => {
                const actief = standaardRust === p.seconden;
                return (
                  <TouchableOpacity
                    key={p.seconden}
                    style={[
                      stijlen.rustPresetKnop,
                      {
                        backgroundColor: actief
                          ? kleuren.accent
                          : kleuren.achtergrondSecundair,
                        borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                      },
                      webPointer,
                    ]}
                    onPress={() => handleKiesRust(p.seconden)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        stijlen.rustPresetTekst,
                        { color: actief ? '#FFFFFF' : kleuren.tekst },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[
                  stijlen.rustPresetKnop,
                  {
                    backgroundColor: isCustomActief
                      ? kleuren.accent
                      : kleuren.achtergrondSecundair,
                    borderColor: isCustomActief ? kleuren.accent : kleuren.kaartRand,
                  },
                  webPointer,
                ]}
                onPress={() => {
                  setCustomRustInput(String(standaardRust));
                  setCustomFout(null);
                  setCustomRustModal(true);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    stijlen.rustPresetTekst,
                    { color: isCustomActief ? '#FFFFFF' : kleuren.tekst },
                  ]}
                >
                  {isCustomActief ? `${standaardRust}s (Custom)` : '+ Custom'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Weergave & Thema */}
          <Text style={[stijlen.sectie, { color: kleuren.tekstSecundair }]}>
            WEERGAVE & THEMA
          </Text>
          <Card padding={18} style={stijlen.sectieKaart}>
            <View style={stijlen.themaGrid}>
              {THEMA_OPTIES.map((t) => {
                const actief = voorkeur === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      stijlen.themaKaart,
                      {
                        backgroundColor: actief
                          ? kleuren.accentGedimpt
                          : kleuren.achtergrondSecundair,
                        borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                        borderWidth: actief ? 1.5 : 1,
                      },
                      webPointer,
                    ]}
                    onPress={() => setVoorkeur(t.id)}
                    activeOpacity={0.82}
                  >
                    {/* Mini thema preview */}
                    <View
                      style={[
                        stijlen.themaPreview,
                        {
                          backgroundColor: t.previewBg,
                          borderColor: kleuren.kaartRand,
                        },
                      ]}
                    >
                      <View
                        style={[
                          stijlen.themaPreviewBalk,
                          { backgroundColor: t.previewCard },
                        ]}
                      />
                      <Ionicons
                        name={t.icoon}
                        size={16}
                        color={actief ? kleuren.accentLicht : t.id === 'licht' ? '#18181B' : '#FAFAFA'}
                      />
                    </View>

                    <Text style={[stijlen.themaLabel, { color: kleuren.tekst }]}>
                      {t.label}
                    </Text>
                    <Text style={[stijlen.themaSub, { color: kleuren.tekstGedimpt }]}>
                      {t.sub}
                    </Text>

                    {actief ? (
                      <View style={[stijlen.actiefVinkje, { backgroundColor: kleuren.accent }]}>
                        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Uitloggen */}
          <View style={stijlen.uitlogContainer}>
            <TouchableOpacity
              style={[
                stijlen.uitlogKnop,
                {
                  borderColor: kleuren.fout + '44',
                  backgroundColor: kleuren.fout + '14',
                },
                webPointer,
              ]}
              onPress={uitloggen}
              activeOpacity={0.8}
              accessibilityLabel="Uitloggen"
            >
              <Ionicons name="log-out-outline" size={18} color={kleuren.fout} />
              <Text style={[stijlen.uitlogTekst, { color: kleuren.fout }]}>Uitloggen</Text>
            </TouchableOpacity>
          </View>
        </ResponsiveContainer>
      </ScrollView>

      {/* Aangepaste Rusttijd BottomSheet */}
      <BottomSheet
        visible={customRustModal}
        onClose={() => {
          setCustomFout(null);
          setCustomRustModal(false);
        }}
        title="Aangepaste Rusttijd"
        subtitle="Voer de standaard rustduur tussen sets in (tussen 10 en 600 seconden)."
        maxWidth={400}
      >
        <View style={stijlen.modalInhoud}>
          <View style={stijlen.inputWrapper}>
            <TextInput
              style={[
                stijlen.customInput,
                {
                  backgroundColor: kleuren.achtergrondSecundair,
                  borderColor: customFout ? kleuren.fout : kleuren.kaartRand,
                  color: kleuren.tekst,
                },
              ]}
              keyboardType="numeric"
              placeholder="bijv. 75"
              placeholderTextColor={kleuren.tekstGedimpt}
              value={customRustInput}
              onChangeText={(t) => {
                setCustomRustInput(t);
                if (customFout) setCustomFout(null);
              }}
              onSubmitEditing={handleCustomRustOpslaan}
              autoFocus
            />
            <Text style={[stijlen.inputEenheid, { color: kleuren.tekstGedimpt }]}>sec</Text>
          </View>

          {customFout ? (
            <View style={stijlen.foutRij}>
              <Ionicons name="alert-circle" size={15} color={kleuren.fout} />
              <Text style={[stijlen.foutTekst, { color: kleuren.fout }]}>{customFout}</Text>
            </View>
          ) : null}

          <View style={stijlen.modalKnoppenRij}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                titel="Annuleren"
                variant="secondary"
                onPress={() => {
                  setCustomFout(null);
                  setCustomRustModal(false);
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton titel="Opslaan" icoon="checkmark" onPress={handleCustomRustOpslaan} />
            </View>
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const stijlen = StyleSheet.create({
  veilig: { flex: 1 },
  scroll: { flex: 1 },
  inhoud: {
    paddingTop: SPACING.md,
    paddingBottom: 48,
  },
  terugKnop: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectie: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'Inter_700Bold',
    marginBottom: 10,
    marginTop: 6,
  },
  sectieKaart: {
    marginBottom: 18,
  },
  accountRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCirkel: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitiaal: {
    fontSize: 20,
    fontFamily: 'Inter_900Black',
  },
  accountTekstBlok: {
    flex: 1,
    minWidth: 0,
  },
  accountNaam: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  accountEmail: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusTekst: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  kaartHeaderRij: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  sectieIcoonBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaartTitel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  kaartUitleg: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    marginTop: 3,
  },
  rustKnoppenRij: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rustPresetKnop: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  rustPresetTekst: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  themaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  themaKaart: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  themaPreview: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  themaPreviewBalk: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    opacity: 0.7,
  },
  themaLabel: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  themaSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  actiefVinkje: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uitlogContainer: {
    marginTop: 6,
  },
  uitlogKnop: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uitlogTekst: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  modalInhoud: {
    gap: 14,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  customInput: {
    height: 54,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  inputEenheid: {
    position: 'absolute',
    right: 16,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  foutRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  foutTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  modalKnoppenRij: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
