import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, normalizeBorderOpacity, cardShadow } from '@/constants/pixelRatio';

const { width: screenWidth } = Dimensions.get('window');

interface FilterItem {
  id: string;
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface SearchableFilterBarProps {
  filters: FilterItem[];
  selectedFilter: string;
  onFilterChange: (id: string) => void;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (text: string) => void;
}

export function SearchableFilterBar({
  filters,
  selectedFilter,
  onFilterChange,
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: SearchableFilterBarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchWidth = useRef(new Animated.Value(44)).current;
  const filtersOpacity = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  const expandSearch = () => {
    setIsSearchExpanded(true);
    Animated.parallel([
      Animated.spring(searchWidth, {
        toValue: screenWidth - 32,
        useNativeDriver: false,
        speed: 14,
        bounciness: 4,
      }),
      Animated.timing(filtersOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      inputRef.current?.focus();
    });
  };

  const collapseSearch = () => {
    inputRef.current?.blur();
    Animated.parallel([
      Animated.spring(searchWidth, {
        toValue: 44,
        useNativeDriver: false,
        speed: 14,
        bounciness: 4,
      }),
      Animated.timing(filtersOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSearchExpanded(false);
      onSearchChange('');
    });
  };

  return (
    <View style={styles.container}>
      {/* Search Button / Expanded Search Bar */}
      <Animated.View style={[styles.searchContainer, { width: searchWidth }]}>
        {isSearchExpanded ? (
          <View style={styles.searchBar}>
            <Search size={20} color={Colors.warmGray} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={Colors.warmGray}
              value={searchValue}
              onChangeText={onSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessible={true}
              accessibilityLabel={searchPlaceholder}
            />
            <TouchableOpacity
              onPress={collapseSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close search"
            >
              <X size={20} color={Colors.warmGray} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={expandSearch}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Search"
            accessibilityHint="Tap to search"
          >
            <Search size={20} color={Colors.deepSage} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Filter Chips */}
      <Animated.View style={[styles.filtersContainer, { opacity: filtersOpacity }]}>
        {!isSearchExpanded && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  selectedFilter === filter.id && [
                    styles.filterChipActive,
                    { backgroundColor: filter.color },
                  ],
                ]}
                onPress={() => onFilterChange(filter.id)}
                activeOpacity={0.75}
                accessible={true}
                accessibilityRole="radio"
                accessibilityLabel={filter.label}
                accessibilityHint={`Show ${filter.label.toLowerCase()} items`}
                accessibilityState={{
                  selected: selectedFilter === filter.id,
                  checked: selectedFilter === filter.id,
                }}
              >
                <View style={styles.iconContainer}>{filter.icon}</View>
                <Text
                  style={[
                    styles.filterLabel,
                    selectedFilter === filter.id && styles.filterLabelActive,
                  ]}
                >
                  {filter.label}
                </Text>
                <Text
                  style={[
                    styles.filterCount,
                    selectedFilter === filter.id && [
                      styles.filterCountActive,
                      { borderColor: filter.color },
                    ],
                  ]}
                >
                  {filter.count}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.filterBar,
  },
  searchContainer: {
    height: 44,
    zIndex: 1,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 154, 123, 0.08)',
    borderWidth: normalizeBorder(1),
    borderColor: `rgba(139, 154, 123, ${normalizeBorderOpacity(0.2)})`,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.sage,
    gap: 12,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 15,
    padding: 0,
  },
  filtersContainer: {
    flex: 1,
    marginLeft: 0,
  },
  filtersContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 154, 123, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginLeft: 12,
    borderWidth: normalizeBorder(1),
    borderColor: `rgba(139, 154, 123, ${normalizeBorderOpacity(0.2)})`,
    gap: 8,
    minHeight: 44,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  filterChipActive: {
    backgroundColor: Colors.linen,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.deepSage,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  filterLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: -0.1,
  },
  filterLabelActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  filterCount: {
    ...Typography.caption,
    color: Colors.deepSage,
    backgroundColor: 'rgba(139, 154, 123, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: '500' as const,
    minWidth: 28,
    textAlign: 'center',
    lineHeight: 18,
    borderWidth: normalizeBorder(0),
    height: 26,
    overflow: 'visible',
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    color: Colors.white,
    fontWeight: '600' as const,
    borderWidth: normalizeBorder(0),
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    height: 26,
    overflow: 'visible',
  },
});
