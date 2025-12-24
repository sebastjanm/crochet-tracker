import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import {
  Trash2,
  Package,
  Calendar,
  Pencil,
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { UniversalHeader } from '@/components/UniversalHeader';
import { ImageGallery } from '@/components/ImageGallery';
import { SectionHeader } from '@/components/SectionHeader';
import { ProjectSelectorModal } from '@/components/ProjectSelectorModal';
import { ProjectLinksSummary } from '@/components/ProjectLinksSummary';
import { useInventory } from '@/hooks/inventory-context';
import { useProjects } from '@/hooks/projects-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, normalizeBorderOpacity } from '@/constants/pixelRatio';

// Helper function to format Date to EU format (DD.MM.YYYY)
function formatEUDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export default function InventoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getItemById, deleteItem, updateItem } = useInventory();
  const { projects } = useProjects();
  const { t } = useLanguage();
  const [item, setItem] = useState(getItemById(id as string));

  const [showProjectSelector, setShowProjectSelector] = useState(false);

  // Refresh item data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const updatedItem = getItemById(id as string);
      if (updatedItem) {
        // Force a new object reference to trigger React re-render
        setItem({ ...updatedItem });
      } else {
        setItem(undefined);
      }
    }, [id, getItemById])
  );

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('inventory.itemNotFound')}</Text>
          <Button
            title={t('common.goBack')}
            onPress={() => router.back()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Get display name from root level
  const displayName = item.name || t('common.untitled');

  // Get category color
  const categoryColor = item.category === 'yarn'
    ? '#FFB84D'
    : item.category === 'hook'
    ? Colors.sage
    : '#9C27B0';

  // Get projects using this item (for badge display)
  const relatedProjects = item.usedInProjects
    ? projects.filter(p => item.usedInProjects?.includes(p.id))
    : [];

  const handleDelete = () => {
    Alert.alert(
      t('inventory.deleteItem'),
      t('inventory.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteItem(item.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleProjectsChange = async (projectIds: string[]) => {
    if (!item) return;
    await updateItem(item.id, {
      usedInProjects: projectIds.length > 0 ? projectIds : undefined,
    });
    // Refresh item data
    const updatedItem = getItemById(item.id);
    if (updatedItem) {
      setItem({ ...updatedItem });
    }
  };

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerWrapper}>
          <UniversalHeader
            title=""
            showBack={true}
            backLabel={t('common.back')}
            showHelp={true}
            helpSection="inventory"
          />
        </View>
      </SafeAreaView>

      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image with title overlay (Apple HIG style) */}
        {item.images && item.images.length > 0 ? (
          <View style={styles.imageSection}>
            <ImageGallery
              images={item.images}
              editable={false}
            />
            {/* Title overlay with gradient */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.titleOverlay}
              pointerEvents="none"
            >
              <Text style={styles.overlayTitle} numberOfLines={2}>
                {displayName}
              </Text>
            </LinearGradient>
          </View>
        ) : (
          /* Large title when no images (Apple HIG pattern) */
          <View style={styles.noImageTitleContainer}>
            <Text style={styles.largeTitle}>{displayName}</Text>
          </View>
        )}

        <View style={styles.content}>

          {/* Category Badge with Inline Quantity */}
          <View style={styles.categoryContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Package size={16} color={Colors.white} />
              <Text style={styles.categoryText}>
                {item.category === 'yarn' ? t('inventory.yarn') :
                 item.category === 'hook' ? t('inventory.hooks') :
                 t('inventory.other')}
              </Text>
            </View>

            {/* Quantity Badge - Inline */}
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityBadgeLabel}>{t('inventory.quantity')}</Text>
              <Text style={styles.quantityBadgeValue}>{item.quantity}</Text>
            </View>

            {/* Used in Projects Badge */}
            {relatedProjects.length > 0 && (
              <View style={styles.usedInProjectsBadge}>
                <Text style={styles.usedInProjectsText}>
                  {t('projects.projects')}: {relatedProjects.length}
                </Text>
              </View>
            )}
          </View>

          {/* Used in Projects - Compact summary */}
          <View style={styles.projectsSection}>
            <Text style={styles.projectsSectionLabel}>{t('inventory.usedInProjects')}</Text>

            <ProjectLinksSummary
              selectedProjectIds={item.usedInProjects || []}
              onPress={() => setShowProjectSelector(true)}
            />

            <ProjectSelectorModal
              visible={showProjectSelector}
              onClose={() => setShowProjectSelector(false)}
              selectedProjectIds={item.usedInProjects || []}
              onSelectionChange={handleProjectsChange}
            />
          </View>

          {/* Yarn-specific details */}
          {item.category === 'yarn' && item.yarnDetails && (
            <View style={styles.detailsCard}>
              <SectionHeader title={t('inventory.yarnDetails')} />

              {item.yarnDetails.brand?.name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.brand')}</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.brand.name}</Text>
                </View>
              )}

              {item.yarnDetails.line && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.productLine')}</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.line}</Text>
                </View>
              )}

              {item.yarnDetails.fibers && item.yarnDetails.fibers.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.fiber')}</Text>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails.fibers.map(f => `${f.percentage}% ${t(`fibers.${f.fiberType}`)}`).join(', ')}
                  </Text>
                </View>
              )}

              {item.yarnDetails.colorName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.color')}</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.colorName}</Text>
                </View>
              )}

              {item.yarnDetails.colorCode && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.colorCode')}</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.colorCode}</Text>
                </View>
              )}

              {item.yarnDetails.colorFamily && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.colorFamily')}</Text>
                  <Text style={styles.detailValue}>{t(`colorFamilies.${item.yarnDetails.colorFamily}`)}</Text>
                </View>
              )}

              {item.yarnDetails.weight?.name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.weightCategory')}</Text>
                  <Text style={styles.detailValue}>
                    {t(`yarnWeights.${item.yarnDetails.weight.name}`)}
                    {item.yarnDetails.weight.ply ? ` (${item.yarnDetails.weight.ply}-ply)` : ''}
                  </Text>
                </View>
              )}

              {(item.yarnDetails.grams || item.yarnDetails.meters) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.ballSpecs')}</Text>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails.grams && `${item.yarnDetails.grams}g`}
                    {(item.yarnDetails.grams && item.yarnDetails.meters) ? ' • ' : ''}
                    {item.yarnDetails.meters && `${item.yarnDetails.meters}m`}
                  </Text>
                </View>
              )}

              {(item.yarnDetails.gaugeStitches || item.yarnDetails.gaugeRows) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.gauge')}</Text>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails.gaugeStitches && `${item.yarnDetails.gaugeStitches} st`}
                    {(item.yarnDetails.gaugeStitches && item.yarnDetails.gaugeRows) ? ' × ' : ''}
                    {item.yarnDetails.gaugeRows && `${item.yarnDetails.gaugeRows} rows`}
                    {' / 10cm'}
                  </Text>
                </View>
              )}

              {(item.yarnDetails.hookSizeMin || item.yarnDetails.hookSizeMax) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.recommendedHook')}</Text>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails.hookSizeMin === item.yarnDetails.hookSizeMax
                      ? `${item.yarnDetails.hookSizeMin}mm`
                      : `${item.yarnDetails.hookSizeMin || '?'}-${item.yarnDetails.hookSizeMax || '?'}mm`}
                  </Text>
                </View>
              )}

              {(item.yarnDetails.needleSizeMin || item.yarnDetails.needleSizeMax) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.recommendedNeedles')}</Text>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails.needleSizeMin === item.yarnDetails.needleSizeMax
                      ? `${item.yarnDetails.needleSizeMin}mm`
                      : `${item.yarnDetails.needleSizeMin || '?'}-${item.yarnDetails.needleSizeMax || '?'}mm`}
                  </Text>
                </View>
              )}
            </View>
          )}





          {/* Hook-specific details */}
          {item.category === 'hook' && item.hookDetails && (
            <View style={styles.detailsCard}>
              <SectionHeader title={t('inventory.hookDetails')} />

              {item.hookDetails.brand && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.brand')}</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.brand}</Text>
                </View>
              )}

              {item.hookDetails.model && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.model')}</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.model}</Text>
                </View>
              )}

              {item.hookDetails.sizeMm && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.sizeMm')}</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.sizeMm}mm</Text>
                </View>
              )}

              {item.hookDetails.material && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.material')}</Text>
                  <Text style={styles.detailValue}>{t(`inventory.material_${item.hookDetails.material}`)}</Text>
                </View>
              )}

              {item.hookDetails.handleType && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.handleType')}</Text>
                  <Text style={styles.detailValue}>{t(`inventory.handleType_${item.hookDetails.handleType}`)}</Text>
                </View>
              )}
            </View>
          )}


          {/* Other-specific details */}
          {item.category === 'other' && item.otherDetails && (
            <View style={styles.detailsCard}>
              <SectionHeader title={t('inventory.itemDetails')} />

              {item.otherDetails.type && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.type')}</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.type}</Text>
                </View>
              )}

              {item.otherDetails.brand && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.brand')}</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.brand}</Text>
                </View>
              )}

              {item.otherDetails.model && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.model')}</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.model}</Text>
                </View>
              )}

              {item.otherDetails.material && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.material')}</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.material}</Text>
                </View>
              )}
            </View>
          )}

          {/* Description - MOVED DOWN for better hierarchy */}
          {item.description && (
            <View style={styles.descriptionCard}>
              <SectionHeader title={t('common.description')} />
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}

          {/* Storage Section */}
          {item.location && (
            <View style={styles.storageCard}>
              <SectionHeader title={t('inventory.storageSection')} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('inventory.location')}</Text>
                <Text style={styles.detailValue}>{item.location}</Text>
              </View>
            </View>
          )}


          {/* Purchase Information - Consistent across all categories */}
          {(item.yarnDetails?.purchaseDate || item.yarnDetails?.purchasePrice ||
            item.yarnDetails?.store || item.hookDetails?.purchaseDate ||
            item.hookDetails?.purchasePrice || item.hookDetails?.store ||
            item.otherDetails?.purchaseDate || item.otherDetails?.purchasePrice ||
            item.otherDetails?.store) && (
            <View style={styles.purchaseCard}>
              <SectionHeader title={t('inventory.purchaseInfo')} />

              {/* Store */}
              {(item.yarnDetails?.store || item.hookDetails?.store || item.otherDetails?.store) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.store')}</Text>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails?.store ||
                     item.hookDetails?.store ||
                     item.otherDetails?.store}
                  </Text>
                </View>
              )}

              {/* Purchase Date */}
              {(item.yarnDetails?.purchaseDate || item.hookDetails?.purchaseDate || item.otherDetails?.purchaseDate) && (
                <View style={styles.detailRow}>
                  <View style={styles.labelWithIcon}>
                    <Calendar size={16} color={Colors.warmGray} />
                    <Text style={styles.detailLabel}>{t('inventory.purchaseDate')}</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails?.purchaseDate && formatEUDate(new Date(item.yarnDetails.purchaseDate))}
                    {item.hookDetails?.purchaseDate && formatEUDate(new Date(item.hookDetails.purchaseDate))}
                    {item.otherDetails?.purchaseDate && formatEUDate(new Date(item.otherDetails.purchaseDate))}
                  </Text>
                </View>
              )}

              {/* Purchase Price with Currency */}
              {(item.yarnDetails?.purchasePrice || item.hookDetails?.purchasePrice ||
                item.otherDetails?.purchasePrice) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.price')}</Text>
                  <Text style={styles.detailValue}>
                    {(() => {
                      const price = item.yarnDetails?.purchasePrice ||
                                   item.hookDetails?.purchasePrice ||
                                   item.otherDetails?.purchasePrice;
                      const currency = item.yarnDetails?.currency ||
                                      item.hookDetails?.currency ||
                                      item.otherDetails?.currency ||
                                      'EUR';

                      // Convert currency codes to symbols
                      const currencySymbol = currency === 'EUR' ? '€' :
                                            currency === 'USD' ? '$' :
                                            currency === 'GBP' ? '£' :
                                            currency === 'CHF' ? 'CHF' :
                                            currency;

                      // Format price with 2 decimal places
                      const formattedPrice = price ? Number(price).toFixed(2) : '0.00';

                      // European convention: number first, then currency with space
                      // Examples: 1.20 €, 5.00 $, 10.50 £, 15.00 CHF
                      return `${formattedPrice} ${currencySymbol}`;
                    })()}
                  </Text>
                </View>
              )}

            </View>
          )}

          {/* Notes */}
          {item.notes && (
            <View style={styles.notesCard}>
              <SectionHeader title={t('common.notes')} />
              <Text style={styles.notes}>{item.notes}</Text>
            </View>
          )}


          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={styles.metaText}>
              {t('inventory.dateAdded')}: {formatEUDate(new Date(item.dateAdded))}
            </Text>
            <Text style={styles.metaText}>
              {t('inventory.lastUpdated')}: {formatEUDate(new Date(item.lastUpdated))}
            </Text>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            {/* Edit Button */}
            <TouchableOpacity
              onPress={() => router.push(`/edit-inventory/${item.id}`)}
              style={styles.editActionButton}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.edit')}
              accessibilityHint={`Edit ${displayName}`}
            >
              <Pencil size={20} color={Colors.deepSage} />
              <Text style={styles.editActionButtonText}>{t('common.edit')}</Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteButton}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}
              accessibilityHint={`Delete ${displayName} permanently`}
            >
              <Trash2 size={20} color={Colors.error} />
              <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: Colors.headerBg,
  },
  safeArea: {
    backgroundColor: Colors.headerBg,
  },
  headerWrapper: {
    backgroundColor: Colors.headerBg,
    paddingVertical: 12,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    ...Typography.title2,
    color: Colors.charcoal,
    marginBottom: 16,
  },
  errorButton: {
    minWidth: 120,
  },
  imageSection: {
    position: 'relative',
    marginBottom: 16,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
  },
  overlayTitle: {
    ...Typography.title1,
    color: Colors.white,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  noImageTitleContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  largeTitle: {
    ...Typography.largeTitle,
    color: Colors.charcoal,
  },
  content: {
    padding: 24,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: 36,
  },
  categoryText: {
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 14,
    letterSpacing: -0.1,
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.deepSage,
    borderRadius: 20,
    minHeight: 36,
  },
  quantityBadgeLabel: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  quantityBadgeValue: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  usedInProjectsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.deepSage,
    borderRadius: 20,
    minHeight: 36,
  },
  usedInProjectsText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  projectsSection: {
    marginBottom: 16,
  },
  projectsSectionLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  descriptionCard: {
    marginBottom: 16,
  },
  storageCard: {
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: Colors.warmGray,
  },
  detailsCard: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 16,
    alignItems: 'flex-start',
    borderBottomWidth: normalizeBorder(0.5),
    borderBottomColor: `rgba(0, 0, 0, ${normalizeBorderOpacity(0.15)})`,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.warmGray,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.charcoal,
    textAlign: 'right',
    flex: 1,
  },
  purchaseCard: {
    marginBottom: 16,
  },
  notesCard: {
    marginBottom: 16,
  },
  notes: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: Colors.warmGray,
  },
  metadata: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: normalizeBorder(1),
    borderTopColor: Colors.border,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.warmGray,
    marginBottom: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 40,
    marginBottom: 32,
  },
  editActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.deepSage,
    minHeight: 52,
  },
  editActionButtonText: {
    ...Typography.body,
    color: Colors.deepSage,
    fontWeight: '500' as const,
    fontSize: 16,
    letterSpacing: -0.1,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: normalizeBorder(1),
    borderColor: `rgba(200, 117, 99, ${normalizeBorderOpacity(0.3)})`,
    minHeight: 52,
  },
  deleteButtonText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '500' as const,
    fontSize: 16,
    letterSpacing: -0.1,
  },
});
