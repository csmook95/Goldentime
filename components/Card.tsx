import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CardProps {
  title: string;
  description: string;
  onPress?: () => void;
  compact?: boolean;
  actionText?: string;
  backgroundColor?: string;
  textColor?: string;
}

export default function Card({ title, description, onPress, compact = false, actionText, backgroundColor, textColor }: CardProps) {
  // 줄바꿈 문자 정규화
  const normalizedDesc = (description ?? '')
    .replace(/\('\\n'\)/g, '\n')   // ('\n') -> \n
    .replace(/\\n/g, '\n');              // \\n   -> \n

  return (
    <TouchableOpacity style={[styles.card, backgroundColor && { backgroundColor }]} onPress={onPress}>
      <View style={[styles.cardContent, compact && styles.cardContentCompact]}>
        <View style={styles.cardHeader}>
          <Text 
            style={[
              styles.cardTitle,
              textColor && { color: textColor },
              Platform.select({
                web: styles.cardTitleWeb
              })
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>
        <View style={styles.cardDescriptionContainer}>
          <Text 
            style={[
              styles.cardDescription,
              textColor && { color: textColor },
              compact && styles.cardDescriptionCompact,
              compact && Platform.select({
                web: styles.cardDescriptionCompactWeb
              }),
              Platform.select({
                web: styles.cardDescriptionWeb
              })
            ]}
            numberOfLines={compact ? 2 : 3}
            ellipsizeMode="tail"
          >
            {normalizedDesc}
          </Text>
        </View>
        {actionText && (
          <View style={styles.cardActionContainer}>
            <Text style={[styles.cardActionText, textColor && { color: textColor }]}>{actionText}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginHorizontal: 6,
    borderWidth: 0,
    minHeight: 200,
    position: 'relative',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    flex: 1,
    width: '100%',
    paddingBottom: 25
  },
  cardContentCompact: {
    gap: 6,
    rowGap: 6
  },
  cardHeader: {
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a73e8',
    marginBottom: 8,
    textAlign: 'center'
  },
  cardTitleWeb: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  cardDescriptionContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingTop: 20
  },
  cardDescription: {
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 0
  },
  cardDescriptionCompact: {
    marginTop: 2,
    marginBottom: 0,
    paddingVertical: 0,
    lineHeight: 18
  },
  cardDescriptionCompactWeb: {
    lineHeight: 20,
    marginTop: 0,
    marginBottom: 0,
    whiteSpace: 'pre-line'
  },
  cardDescriptionWeb: {
    whiteSpace: 'pre-line'
  },
  cardActionContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardActionText: {
    fontSize: 20,
    color: '#1a73e8',
    fontWeight: '500'
  }
});
