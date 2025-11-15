import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Edit,
  Trash2,
  Package,
  MapPin,
  Calendar,
  Tag,
  Layers,
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ModalHeader } from '@/components/ModalHeader';
import { ImageGallery } from '@/components/ImageGallery';
import { useInventory } from '@/hooks/inventory-context';
import { useProjects } from '@/hooks/projects-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function InventoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getItemById, deleteItem, updateItem } = useInventory();
  const { projects } = useProjects();
  const { t } = useLanguage();
  const item = getItemById(id as string);

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

  // Get display name based on category
  const displayName = item.category === 'yarn'
    ? (item.yarnDetails?.name || 'Untitled')
    : item.category === 'hook'
    ? (item.hookDetails?.name || 'Untitled')
    : (item.otherDetails?.name || 'Untitled');

  // Get category color
  const categoryColor = item.category === 'yarn'
    ? '#FFB84D'
    : item.category === 'hook'
    ? Colors.sage
    : '#9C27B0';

  // Get projects using this item
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalHeader title={displayName} />

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/edit-inventory/${item.id}`)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.edit')}
          accessibilityHint={`Edit ${displayName} details`}
        >
          <Edit size={20} color={Colors.charcoal} />
          <Text style={styles.actionText}>{t('common.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.delete')}
          accessibilityHint={`Delete ${displayName} permanently`}
        >
          <Trash2 size={20} color={Colors.error} />
          <Text style={[styles.actionText, { color: Colors.error }]}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {item.images && item.images.length > 0 && (
          <View style={styles.imageGalleryContainer}>
            <ImageGallery
              images={item.images}
              onImagesChange={(images) => updateItem(item.id, { images })}
              editable={true}
            />
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
              <Text style={styles.quantityBadgeLabel}>{t('inventory.quantity')}:</Text>
              <Text style={styles.quantityBadgeValue}>{item.quantity}</Text>
              {item.unit && (
                <Text style={styles.quantityBadgeUnit}>{item.unit}</Text>
              )}
            </View>

            {/* Min Quantity Badge - Inline */}
            {item.minQuantity && (
              <View style={styles.minQuantityBadge}>
                <Text style={styles.minQuantityBadgeLabel}>{t('inventory.minQuantity')}:</Text>
                <Text style={styles.minQuantityBadgeValue}>{item.minQuantity}</Text>
              </View>
            )}
          </View>

          {/* Yarn-specific details */}
          {item.category === 'yarn' && item.yarnDetails && (
            <Card style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>{t('inventory.yarnDetails')}</Text>

              {item.yarnDetails.brand && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.brand')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.brand}</Text>
                </View>
              )}

              {item.yarnDetails.fiber && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.fiber')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.fiber}</Text>
                </View>
              )}

              {item.yarnDetails.color && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.color')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.color}</Text>
                </View>
              )}

              {item.yarnDetails.weight_category && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.weightCategory')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.weight_category}</Text>
                </View>
              )}

              {(item.yarnDetails.ball_weight || item.yarnDetails.length) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.ballSpecs')}:</Text>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails.ball_weight && `${item.yarnDetails.ball_weight}g`}
                    {item.yarnDetails.ball_weight && item.yarnDetails.length && ' • '}
                    {item.yarnDetails.length && `${item.yarnDetails.length}m`}
                  </Text>
                </View>
              )}

              {(item.yarnDetails.total_weight || item.yarnDetails.total_length) && (
                <View style={[styles.detailRow, styles.highlightRow]}>
                  <Text style={styles.detailLabel}>{t('inventory.totalSpecs')}:</Text>
                  <Text style={[styles.detailValue, styles.highlightValue]}>
                    {item.yarnDetails.total_weight && `${item.yarnDetails.total_weight}g`}
                    {item.yarnDetails.total_weight && item.yarnDetails.total_length && ' • '}
                    {item.yarnDetails.total_length && `${item.yarnDetails.total_length}m`}
                  </Text>
                </View>
              )}

              {item.yarnDetails.hook_size && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.recommendedHook')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.hook_size}</Text>
                </View>
              )}
            </Card>
          )}

          {/* Hook-specific details */}
          {item.category === 'hook' && item.hookDetails && (
            <Card style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>{t('inventory.hookDetails')}</Text>

              {item.hookDetails.brand && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.brand')}:</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.brand}</Text>
                </View>
              )}

              {item.hookDetails.size && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.size')}:</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.size}</Text>
                </View>
              )}

              {(item.hookDetails.sizeMetric || item.hookDetails.sizeUS || item.hookDetails.sizeUK) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.sizeConversions')}:</Text>
                  <Text style={styles.detailValue}>
                    {item.hookDetails.sizeMetric && `${item.hookDetails.sizeMetric}mm`}
                    {item.hookDetails.sizeUS && ` / US ${item.hookDetails.sizeUS}`}
                    {item.hookDetails.sizeUK && ` / UK ${item.hookDetails.sizeUK}`}
                  </Text>
                </View>
              )}

              {item.hookDetails.material && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.material')}:</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.material}</Text>
                </View>
              )}

              {item.hookDetails.handleType && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.handleType')}:</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.handleType}</Text>
                </View>
              )}
            </Card>
          )}

          {/* Other-specific details */}
          {item.category === 'other' && item.otherDetails && (
            <Card style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>{t('inventory.itemDetails')}</Text>

              {item.otherDetails.type && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.type')}:</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.type}</Text>
                </View>
              )}

              {item.otherDetails.brand && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.brand')}:</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.brand}</Text>
                </View>
              )}

              {item.otherDetails.material && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.material')}:</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.material}</Text>
                </View>
              )}

              {item.otherDetails.size && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.size')}:</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.size}</Text>
                </View>
              )}

              {item.otherDetails.setSize && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.setSize')}:</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.setSize}</Text>
                </View>
              )}
            </Card>
          )}

          {/* Description - MOVED DOWN for better hierarchy */}
          {item.description && (
            <Card style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>{t('common.description')}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </Card>
          )}

          {/* Location & Tags */}
          {(item.location || (item.tags && item.tags.length > 0)) && (
            <Card style={styles.locationCard}>
              {item.location && (
                <View style={styles.locationRow}>
                  <MapPin size={18} color={Colors.teal} />
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>{t('inventory.location')}</Text>
                    <Text style={styles.locationValue}>{item.location}</Text>
                  </View>
                </View>
              )}

              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  <Tag size={18} color={Colors.sage} />
                  <View style={styles.tagsInfo}>
                    <Text style={styles.tagsLabel}>{t('inventory.tags')}</Text>
                    <View style={styles.tagsContainer}>
                      {item.tags.map((tag: string, index: number) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </Card>
          )}

          {/* Projects using this item */}
          {relatedProjects.length > 0 && (
            <Card style={styles.projectsCard}>
              <View style={styles.projectsHeader}>
                <Layers size={20} color={Colors.deepSage} />
                <Text style={styles.sectionTitle}>{t('inventory.usedInProjects')}</Text>
              </View>
              {relatedProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectItem}
                  onPress={() => router.push(`/project/${project.id}`)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={project.title}
                  accessibilityHint="View project details"
                >
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <Text style={styles.projectStatus}>
                    {project.status === 'completed' ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Purchase Information - MOVED DOWN (reference data) */}
          {(item.yarnDetails?.purchase_date || item.yarnDetails?.purchase_price ||
            item.yarnDetails?.store || item.hookDetails?.purchaseDate ||
            item.hookDetails?.purchasePrice || item.hookDetails?.purchaseLocation ||
            item.otherDetails?.purchasePrice || item.otherDetails?.purchaseLocation) && (
            <Card style={styles.purchaseCard}>
              <Text style={styles.sectionTitle}>{t('inventory.purchaseInfo')}</Text>

              {/* Yarn purchase info */}
              {item.yarnDetails?.purchase_date && (
                <View style={styles.detailRow}>
                  <Calendar size={16} color={Colors.warmGray} />
                  <Text style={styles.detailLabel}>{t('inventory.purchaseDate')}:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(item.yarnDetails.purchase_date).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {(item.yarnDetails?.purchase_price || item.hookDetails?.purchasePrice ||
                item.otherDetails?.purchasePrice) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.price')}:</Text>
                  <Text style={styles.detailValue}>
                    €{item.yarnDetails?.purchase_price ||
                       item.hookDetails?.purchasePrice ||
                       item.otherDetails?.purchasePrice}
                  </Text>
                </View>
              )}

              {(item.yarnDetails?.store || item.hookDetails?.purchaseLocation ||
                item.otherDetails?.purchaseLocation) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.store')}:</Text>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails?.store ||
                     item.hookDetails?.purchaseLocation ||
                     item.otherDetails?.purchaseLocation}
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Notes */}
          {item.notes && (
            <Card style={styles.notesCard}>
              <Text style={styles.sectionTitle}>{t('common.notes')}</Text>
              <Text style={styles.notes}>{item.notes}</Text>
            </Card>
          )}

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={styles.metaText}>
              {t('inventory.dateAdded')}: {new Date(item.dateAdded).toLocaleDateString()}
            </Text>
            <Text style={styles.metaText}>
              {t('inventory.lastUpdated')}: {new Date(item.lastUpdated).toLocaleDateString()}
            </Text>
            {item.lastUsed && (
              <Text style={styles.metaText}>
                {t('inventory.lastUsed')}: {new Date(item.lastUsed).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.cream,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 44,
  },
  actionText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '500',
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
  imageGalleryContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  content: {
    padding: 16,
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
    borderRadius: 20,
  },
  categoryText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.deepSage,
    borderRadius: 20,
  },
  quantityBadgeLabel: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  quantityBadgeValue: {
    ...Typography.title3,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 20,
  },
  quantityBadgeUnit: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '500',
    fontSize: 13,
  },
  minQuantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.warning,
    borderRadius: 20,
  },
  minQuantityBadgeLabel: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  minQuantityBadgeValue: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  descriptionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    marginBottom: 12,
  },
  description: {
    ...Typography.bodyLarge,
    color: Colors.warmGray,
    lineHeight: 24,
  },
  detailsCard: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    gap: 8,
    alignItems: 'flex-start',
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.warmGray,
    fontWeight: '500',
    minWidth: 100,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.charcoal,
    flex: 1,
  },
  highlightRow: {
    backgroundColor: Colors.beige,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginTop: 8,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 8,
  },
  highlightValue: {
    fontWeight: '600',
    color: Colors.deepSage,
  },
  locationCard: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginBottom: 4,
  },
  locationValue: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tagsInfo: {
    flex: 1,
  },
  tagsLabel: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.beige,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontWeight: '500',
  },
  purchaseCard: {
    marginBottom: 16,
  },
  projectsCard: {
    marginBottom: 16,
  },
  projectsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.beige,
    borderRadius: 8,
    marginBottom: 8,
  },
  projectTitle: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '500',
    flex: 1,
  },
  projectStatus: {
    ...Typography.body,
    color: Colors.deepSage,
    fontSize: 18,
  },
  notesCard: {
    marginBottom: 16,
  },
  notes: {
    ...Typography.body,
    color: Colors.warmGray,
    lineHeight: 22,
  },
  metadata: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginBottom: 4,
  },
});
