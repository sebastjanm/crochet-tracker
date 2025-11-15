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
  Ruler,
  ExternalLink,
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

  // Get display name from root level
  const displayName = item.name || t('common.untitled');

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

            {/* Reserved Status Badge */}
            {item.reserved && (
              <View style={styles.reservedBadge}>
                <Text style={styles.reservedText}>{t('inventory.reserved')}</Text>
              </View>
            )}
          </View>

          {/* Reserved for Project - Show which project */}
          {item.reserved && item.reservedForProject && (
            <Card style={styles.reservedCard}>
              <Text style={styles.reservedLabel}>{t('inventory.reservedFor')}:</Text>
              <TouchableOpacity
                onPress={() => router.push(`/project/${item.reservedForProject}`)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('inventory.reservedFor')}
                accessibilityHint="View project details"
              >
                <Text style={styles.reservedProjectLink}>
                  {projects.find(p => p.id === item.reservedForProject)?.title || item.reservedForProject}
                </Text>
              </TouchableOpacity>
            </Card>
          )}

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

              {item.yarnDetails.line && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.productLine')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.line}</Text>
                </View>
              )}

              {item.yarnDetails.fiber && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.fiber')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.fiber}</Text>
                </View>
              )}

              {item.yarnDetails.colorName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.color')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.colorName}</Text>
                </View>
              )}

              {item.yarnDetails.colorCode && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.colorCode')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.colorCode}</Text>
                </View>
              )}

              {item.yarnDetails.weightCategory && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.weightCategory')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.weightCategory}</Text>
                </View>
              )}

              {(item.yarnDetails.ballWeightG || item.yarnDetails.lengthM || item.yarnDetails.ballWeightOz || item.yarnDetails.lengthYd) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.ballSpecs')}:</Text>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails.ballWeightG && `${item.yarnDetails.ballWeightG}g`}
                    {item.yarnDetails.ballWeightOz && ` (${item.yarnDetails.ballWeightOz}oz)`}
                    {((item.yarnDetails.ballWeightG || item.yarnDetails.ballWeightOz) && (item.yarnDetails.lengthM || item.yarnDetails.lengthYd)) ? ' • ' : ''}
                    {item.yarnDetails.lengthM && `${item.yarnDetails.lengthM}m`}
                    {item.yarnDetails.lengthYd && ` (${item.yarnDetails.lengthYd}yd)`}
                  </Text>
                </View>
              )}

              {(item.yarnDetails.ballWeightG || item.yarnDetails.lengthM || item.yarnDetails.ballWeightOz || item.yarnDetails.lengthYd) && (
                <View style={[styles.detailRow, styles.highlightRow]}>
                  <Text style={styles.detailLabel}>{t('inventory.totalSpecs')}:</Text>
                  <Text style={[styles.detailValue, styles.highlightValue]}>
                    {item.yarnDetails.ballWeightG && `${item.yarnDetails.ballWeightG * item.quantity}g`}
                    {item.yarnDetails.ballWeightOz && ` (${(item.yarnDetails.ballWeightOz * item.quantity).toFixed(2)}oz)`}
                    {((item.yarnDetails.ballWeightG || item.yarnDetails.ballWeightOz) && (item.yarnDetails.lengthM || item.yarnDetails.lengthYd)) ? ' • ' : ''}
                    {item.yarnDetails.lengthM && `${item.yarnDetails.lengthM * item.quantity}m`}
                    {item.yarnDetails.lengthYd && ` (${item.yarnDetails.lengthYd * item.quantity}yd)`}
                  </Text>
                </View>
              )}

              {item.yarnDetails.hookSizeMm && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.recommendedHook')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.hookSizeMm}</Text>
                </View>
              )}

              {(item.yarnDetails.needleSizeMm || item.yarnDetails.needleSizeUs) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.recommendedNeedles')}:</Text>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails.needleSizeMm && `${item.yarnDetails.needleSizeMm}mm`}
                    {(item.yarnDetails.needleSizeMm && item.yarnDetails.needleSizeUs) ? ' / ' : ''}
                    {item.yarnDetails.needleSizeUs && `US ${item.yarnDetails.needleSizeUs}`}
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Gauge Information for Yarn */}
          {item.category === 'yarn' && item.yarnDetails && (item.yarnDetails.gauge || item.yarnDetails.myGauge) && (
            <Card style={styles.detailsCard}>
              <View style={styles.gaugeTitleRow}>
                <Ruler size={20} color={Colors.deepTeal} />
                <Text style={styles.sectionTitle}>{t('inventory.gauge')}</Text>
              </View>

              {/* Manufacturer's Gauge */}
              {item.yarnDetails.gauge && (
                <View style={styles.gaugeSection}>
                  <Text style={styles.gaugeSubtitle}>{t('inventory.manufacturerGauge')}</Text>

                  {(item.yarnDetails.gauge.stitches || item.yarnDetails.gauge.rows) && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('inventory.stitches')} × {t('inventory.rows')}:</Text>
                      <Text style={styles.detailValue}>
                        {item.yarnDetails.gauge.stitches || '?'} × {item.yarnDetails.gauge.rows || '?'}
                      </Text>
                    </View>
                  )}

                  {item.yarnDetails.gauge.sizeCm && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('inventory.gaugeSize')}:</Text>
                      <Text style={styles.detailValue}>{item.yarnDetails.gauge.sizeCm}</Text>
                    </View>
                  )}

                  {item.yarnDetails.gauge.tool && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('inventory.gaugeTool')}:</Text>
                      <Text style={styles.detailValue}>{item.yarnDetails.gauge.tool}</Text>
                    </View>
                  )}

                  {item.yarnDetails.gauge.pattern && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('inventory.gaugePattern')}:</Text>
                      <Text style={styles.detailValue}>{item.yarnDetails.gauge.pattern}</Text>
                    </View>
                  )}

                  {item.yarnDetails.gauge.notes && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('common.notes')}:</Text>
                      <Text style={styles.detailValue}>{item.yarnDetails.gauge.notes}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* My Gauge */}
              {item.yarnDetails.myGauge && (
                <View style={styles.gaugeSection}>
                  <Text style={[styles.gaugeSubtitle, styles.myGaugeTitle]}>{t('inventory.myGauge')}</Text>

                  {(item.yarnDetails.myGauge.stitches || item.yarnDetails.myGauge.rows) && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('inventory.stitches')} × {t('inventory.rows')}:</Text>
                      <Text style={styles.detailValue}>
                        {item.yarnDetails.myGauge.stitches || '?'} × {item.yarnDetails.myGauge.rows || '?'}
                      </Text>
                    </View>
                  )}

                  {item.yarnDetails.myGauge.sizeCm && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('inventory.gaugeSize')}:</Text>
                      <Text style={styles.detailValue}>{item.yarnDetails.myGauge.sizeCm}</Text>
                    </View>
                  )}

                  {item.yarnDetails.myGauge.tool && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('inventory.gaugeTool')}:</Text>
                      <Text style={styles.detailValue}>{item.yarnDetails.myGauge.tool}</Text>
                    </View>
                  )}

                  {item.yarnDetails.myGauge.pattern && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('inventory.gaugePattern')}:</Text>
                      <Text style={styles.detailValue}>{item.yarnDetails.myGauge.pattern}</Text>
                    </View>
                  )}

                  {item.yarnDetails.myGauge.notes && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('common.notes')}:</Text>
                      <Text style={styles.detailValue}>{item.yarnDetails.myGauge.notes}</Text>
                    </View>
                  )}
                </View>
              )}
            </Card>
          )}

          {/* Care Instructions for Yarn */}
          {item.category === 'yarn' && item.yarnDetails && (item.yarnDetails.careSymbols || item.yarnDetails.careText) && (
            <Card style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>{t('inventory.careInstructions')}</Text>

              {item.yarnDetails.careSymbols && item.yarnDetails.careSymbols.length > 0 && (
                <View style={styles.careSymbolsContainer}>
                  {item.yarnDetails.careSymbols.map((symbol: string, index: number) => (
                    <View key={index} style={styles.careSymbolBadge}>
                      <Text style={styles.careSymbolText}>{t(`inventory.${symbol}`)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {item.yarnDetails.careText && (
                <View style={styles.detailRow}>
                  <Text style={styles.careText}>{item.yarnDetails.careText}</Text>
                </View>
              )}
            </Card>
          )}

          {/* Yarn Characteristics */}
          {item.category === 'yarn' && item.yarnDetails && (item.yarnDetails.halo || item.yarnDetails.selfStriping ||
            item.yarnDetails.variegated || item.yarnDetails.texture || item.yarnDetails.sheen ||
            item.yarnDetails.colorFamily || item.yarnDetails.recommendedFor) && (
            <Card style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>{t('inventory.yarnCharacteristics')}</Text>

              {/* Boolean characteristics as badges */}
              <View style={styles.characteristicsContainer}>
                {item.yarnDetails.halo && (
                  <View style={styles.characteristicBadge}>
                    <Text style={styles.characteristicText}>{t('inventory.halo')}</Text>
                  </View>
                )}
                {item.yarnDetails.selfStriping && (
                  <View style={styles.characteristicBadge}>
                    <Text style={styles.characteristicText}>{t('inventory.selfStriping')}</Text>
                  </View>
                )}
                {item.yarnDetails.variegated && (
                  <View style={styles.characteristicBadge}>
                    <Text style={styles.characteristicText}>{t('inventory.variegated')}</Text>
                  </View>
                )}
              </View>

              {/* Text characteristics */}
              {item.yarnDetails.texture && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.texture')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.texture}</Text>
                </View>
              )}

              {item.yarnDetails.sheen && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.sheen')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.sheen}</Text>
                </View>
              )}

              {item.yarnDetails.colorFamily && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.colorFamily')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.colorFamily}</Text>
                </View>
              )}

              {item.yarnDetails.recommendedFor && item.yarnDetails.recommendedFor.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.recommendedFor')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.recommendedFor.join(', ')}</Text>
                </View>
              )}
            </Card>
          )}

          {/* Certifications & Quality Info for Yarn */}
          {item.category === 'yarn' && item.yarnDetails && (item.yarnDetails.certifications || item.yarnDetails.certificateDetails) && (
            <Card style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>{t('inventory.certifications')}</Text>

              {item.yarnDetails.certifications && item.yarnDetails.certifications.length > 0 && (
                <View style={styles.certificationsContainer}>
                  {item.yarnDetails.certifications.map((cert: string, index: number) => (
                    <View key={index} style={styles.certificationBadge}>
                      <Text style={styles.certificationText}>{cert}</Text>
                    </View>
                  ))}
                </View>
              )}

              {item.yarnDetails.certificateDetails && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.certificateDetails')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.certificateDetails}</Text>
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

              {item.hookDetails.line && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.productLine')}:</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.line}</Text>
                </View>
              )}

              {item.hookDetails.size && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.size')}:</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.size}</Text>
                </View>
              )}

              {(item.hookDetails.sizeMm || item.hookDetails.sizeUs || item.hookDetails.sizeUk) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.sizeConversions')}:</Text>
                  <Text style={styles.detailValue}>
                    {item.hookDetails.sizeMm && `${item.hookDetails.sizeMm}mm`}
                    {item.hookDetails.sizeUs ? ` / US ${item.hookDetails.sizeUs}` : ''}
                    {item.hookDetails.sizeUk ? ` / UK ${item.hookDetails.sizeUk}` : ''}
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

              {/* Dimensions */}
              {(item.hookDetails.lengthCm || item.hookDetails.lengthIn) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.hookLength')}:</Text>
                  <Text style={styles.detailValue}>
                    {item.hookDetails.lengthCm && `${item.hookDetails.lengthCm}cm`}
                    {(item.hookDetails.lengthCm && item.hookDetails.lengthIn) ? ' / ' : ''}
                    {item.hookDetails.lengthIn && `${item.hookDetails.lengthIn}"`}
                  </Text>
                </View>
              )}

              {/* Technical Details */}
              {item.hookDetails.shaftType && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.shaftType')}:</Text>
                  <Text style={styles.detailValue}>
                    {item.hookDetails.shaftType === 'inline' ? t('inventory.inline') :
                     item.hookDetails.shaftType === 'tapered' ? t('inventory.tapered') :
                     item.hookDetails.shaftType}
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Hook Features */}
          {item.category === 'hook' && item.hookDetails && (item.hookDetails.colorCoded || item.hookDetails.nonSlip ||
            item.hookDetails.lightWeight || item.hookDetails.flexible || item.hookDetails.thumbRest ||
            item.hookDetails.recommendedYarnWeights || item.hookDetails.bestFor) && (
            <Card style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>{t('inventory.hookFeatures')}</Text>

              {/* Feature badges */}
              <View style={styles.characteristicsContainer}>
                {item.hookDetails.colorCoded && (
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureText}>{t('inventory.colorCoded')}</Text>
                  </View>
                )}
                {item.hookDetails.nonSlip && (
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureText}>{t('inventory.nonSlip')}</Text>
                  </View>
                )}
                {item.hookDetails.lightWeight && (
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureText}>{t('inventory.lightWeight')}</Text>
                  </View>
                )}
                {item.hookDetails.flexible && (
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureText}>{t('inventory.flexible')}</Text>
                  </View>
                )}
                {item.hookDetails.thumbRest && (
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureText}>{t('inventory.thumbRest')}</Text>
                  </View>
                )}
              </View>

              {/* Recommended yarn weights */}
              {item.hookDetails.recommendedYarnWeights && item.hookDetails.recommendedYarnWeights.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.recommendedYarnWeights')}:</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.recommendedYarnWeights.join(', ')}</Text>
                </View>
              )}

              {/* Best for */}
              {item.hookDetails.bestFor && item.hookDetails.bestFor.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.bestFor')}:</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.bestFor.join(', ')}</Text>
                </View>
              )}
            </Card>
          )}

          {/* Hook Quality & Origin */}
          {item.category === 'hook' && item.hookDetails && (item.hookDetails.country || item.hookDetails.warranty || item.hookDetails.certifications) && (
            <Card style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>{t('inventory.qualityInfo')}</Text>

              {item.hookDetails.certifications && item.hookDetails.certifications.length > 0 && (
                <View style={styles.certificationsContainer}>
                  {item.hookDetails.certifications.map((cert: string, index: number) => (
                    <View key={index} style={styles.certificationBadge}>
                      <Text style={styles.certificationText}>{cert}</Text>
                    </View>
                  ))}
                </View>
              )}

              {item.hookDetails.country && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.country')}:</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.country}</Text>
                </View>
              )}

              {item.hookDetails.warranty && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.warranty')}:</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.warranty}</Text>
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

              {item.otherDetails.color && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.color')}:</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.color}</Text>
                </View>
              )}

              {item.otherDetails.dimensions && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.dimensions')}:</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.dimensions}</Text>
                </View>
              )}

              {item.otherDetails.weight && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.weight')}:</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.weight}</Text>
                </View>
              )}

              {item.otherDetails.model && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.model')}:</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.model}</Text>
                </View>
              )}
            </Card>
          )}

          {/* Other Item Features */}
          {item.category === 'other' && item.otherDetails && (item.otherDetails.features || item.otherDetails.compatibleWith || item.otherDetails.bestFor) && (
            <Card style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>{t('inventory.features')}</Text>

              {/* Feature badges */}
              {item.otherDetails.features && item.otherDetails.features.length > 0 && (
                <View style={styles.characteristicsContainer}>
                  {item.otherDetails.features.map((feature: string, index: number) => (
                    <View key={index} style={styles.featureBadge}>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}

              {item.otherDetails.compatibleWith && item.otherDetails.compatibleWith.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.compatibleWith')}:</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.compatibleWith.join(', ')}</Text>
                </View>
              )}

              {item.otherDetails.bestFor && item.otherDetails.bestFor.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.bestFor')}:</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.bestFor.join(', ')}</Text>
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

          {/* Storage Section */}
          {((item.category === 'yarn' && item.yarnDetails?.storageLocation) ||
            (item.category === 'hook' && item.hookDetails?.storageLocation) ||
            (item.category === 'other' && item.otherDetails?.storageLocation)) && (
            <Card style={styles.storageCard}>
              <Text style={styles.sectionTitle}>{t('inventory.storageSection')}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('inventory.storageLocation')}:</Text>
                <Text style={styles.detailValue}>
                  {item.category === 'yarn' && item.yarnDetails?.storageLocation}
                  {item.category === 'hook' && item.hookDetails?.storageLocation}
                  {item.category === 'other' && item.otherDetails?.storageLocation}
                </Text>
              </View>
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

          {/* Purchase Information - Consistent across all categories */}
          {(item.yarnDetails?.purchaseDate || item.yarnDetails?.purchasePrice ||
            item.yarnDetails?.store || item.hookDetails?.purchaseDate ||
            item.hookDetails?.purchasePrice || item.hookDetails?.store ||
            item.otherDetails?.purchaseDate || item.otherDetails?.purchasePrice ||
            item.otherDetails?.store || item.yarnDetails?.originalUrl ||
            item.hookDetails?.originalUrl || item.otherDetails?.originalUrl) && (
            <Card style={styles.purchaseCard}>
              <Text style={styles.sectionTitle}>{t('inventory.purchaseInfo')}</Text>

              {/* Store */}
              {(item.yarnDetails?.store || item.hookDetails?.store || item.otherDetails?.store) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.store')}:</Text>
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
                  <Calendar size={16} color={Colors.warmGray} />
                  <Text style={styles.detailLabel}>{t('inventory.purchaseDate')}:</Text>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails?.purchaseDate && new Date(item.yarnDetails.purchaseDate).toLocaleDateString()}
                    {item.hookDetails?.purchaseDate && new Date(item.hookDetails.purchaseDate).toLocaleDateString()}
                    {item.otherDetails?.purchaseDate && new Date(item.otherDetails.purchaseDate).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {/* Purchase Price with Currency */}
              {(item.yarnDetails?.purchasePrice || item.hookDetails?.purchasePrice ||
                item.otherDetails?.purchasePrice) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.price')}:</Text>
                  <Text style={styles.detailValue}>
                    {item.yarnDetails?.currency || item.hookDetails?.currency || item.otherDetails?.currency || '€'}
                    {item.yarnDetails?.purchasePrice ||
                       item.hookDetails?.purchasePrice ||
                       item.otherDetails?.purchasePrice}
                  </Text>
                </View>
              )}

              {/* Product URL */}
              {(item.yarnDetails?.originalUrl || item.hookDetails?.originalUrl || item.otherDetails?.originalUrl) && (
                <TouchableOpacity
                  style={styles.productUrlButton}
                  onPress={() => {
                    const url = item.yarnDetails?.originalUrl || item.hookDetails?.originalUrl || item.otherDetails?.originalUrl;
                    if (url) {
                      // TODO: Add Linking.openURL(url) when implemented
                      Alert.alert(t('inventory.viewProductPage'), url);
                    }
                  }}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="link"
                  accessibilityLabel={t('inventory.viewProductPage')}
                >
                  <ExternalLink size={16} color={Colors.deepTeal} />
                  <Text style={styles.productUrlText}>{t('inventory.viewProductPage')}</Text>
                </TouchableOpacity>
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

          {/* Barcode/UPC Information */}
          {(item.barcode || item.upcData ||
            (item.category === 'yarn' && item.yarnDetails?.sku) ||
            (item.category === 'hook' && item.hookDetails?.sku) ||
            (item.category === 'other' && item.otherDetails?.sku)) && (
            <Card style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>{t('inventory.productInfo')}</Text>

              {item.barcode && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.barcode')}:</Text>
                  <Text style={styles.detailValue}>{item.barcode}</Text>
                </View>
              )}

              {(item.category === 'yarn' && item.yarnDetails?.sku) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.sku')}:</Text>
                  <Text style={styles.detailValue}>{item.yarnDetails.sku}</Text>
                </View>
              )}

              {(item.category === 'hook' && item.hookDetails?.sku) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.sku')}:</Text>
                  <Text style={styles.detailValue}>{item.hookDetails.sku}</Text>
                </View>
              )}

              {(item.category === 'other' && item.otherDetails?.sku) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('inventory.sku')}:</Text>
                  <Text style={styles.detailValue}>{item.otherDetails.sku}</Text>
                </View>
              )}

              {item.upcData && (
                <>
                  {item.upcData.title && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('inventory.itemName')}:</Text>
                      <Text style={styles.detailValue}>{item.upcData.title}</Text>
                    </View>
                  )}
                  {item.upcData.brand && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('inventory.brand')}:</Text>
                      <Text style={styles.detailValue}>{item.upcData.brand}</Text>
                    </View>
                  )}
                  {item.upcData.description && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('common.description')}:</Text>
                      <Text style={styles.detailValue}>{item.upcData.description}</Text>
                    </View>
                  )}
                </>
              )}
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
  reservedBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
  },
  reservedText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  reservedCard: {
    marginBottom: 16,
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  reservedLabel: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginBottom: 8,
  },
  reservedProjectLink: {
    ...Typography.body,
    color: Colors.deepTeal,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  descriptionCard: {
    marginBottom: 16,
  },
  storageCard: {
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
  gaugeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  gaugeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  gaugeSubtitle: {
    ...Typography.body,
    color: Colors.deepSage,
    fontWeight: '600',
    marginBottom: 12,
  },
  myGaugeTitle: {
    color: Colors.deepTeal,
  },
  careSymbolsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  careSymbolBadge: {
    backgroundColor: Colors.beige,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  careSymbolText: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontWeight: '500',
  },
  careText: {
    ...Typography.body,
    color: Colors.warmGray,
    lineHeight: 22,
  },
  characteristicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  characteristicBadge: {
    backgroundColor: Colors.deepSage,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  characteristicText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '500',
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  certificationBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  certificationText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  featureBadge: {
    backgroundColor: Colors.deepTeal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featureText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '500',
  },
  productUrlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.beige,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.deepTeal,
  },
  productUrlText: {
    ...Typography.body,
    color: Colors.deepTeal,
    fontWeight: '600',
  },
});
