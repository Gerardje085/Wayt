// ─────────────────────────────────────────────────────────────────────────────
// Wayt – ExerciseGuideModal Component
// Modal sheet wrapping ExerciseGuideView cleanly on mobile & desktop web.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { StyleSheet, View } from 'react-native';
import ExerciseGuideView from './ExerciseGuideView';
import { BottomSheet } from './ui/BottomSheet';
import { PrimaryButton } from './ui/PrimaryButton';
import type { ExerciseDbItem } from '../services/exerciseDb';

interface ExerciseGuideModalProps {
  zichtbaar: boolean;
  onSluiten: () => void;
  oefeningId: string;
  oefeningNaam?: string;
  data?: ExerciseDbItem | null;
}

export default function ExerciseGuideModal({
  zichtbaar, onSluiten, oefeningId, oefeningNaam, data,
}: ExerciseGuideModalProps) {
  return (
    <BottomSheet
      visible={zichtbaar}
      onClose={onSluiten}
      title={oefeningNaam || oefeningId}
      subtitle="Oefeninstructies & beweging"
      maxWidth={600}
      scrollable
    >
      <View style={s.inhoud}>
        <ExerciseGuideView oefeningId={oefeningId} oefeningNaam={oefeningNaam} data={data} />

        <PrimaryButton
          titel="Sluiten"
          onPress={onSluiten}
          variant="secondary"
          volledigeBreedte
        />
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  inhoud: {
    paddingBottom: 6,
  },
});
