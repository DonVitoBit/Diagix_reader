import React, { useCallback } from 'react';
import { View, ViewStyle } from 'react-native';
import { VirtualizedList } from 'react-native-web';
import { useWindowDimensions } from 'react-native';

interface UseVirtualListProps<T> {
  data: T[];
  estimatedItemSize: number;
  renderItem: (item: T, index: number) => React.ReactElement;
  getItemType?: (item: T) => string;
  keyExtractor: (item: T) => string;
  overscan?: number;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function useVirtualList<T>({
  data,
  estimatedItemSize,
  renderItem,
  getItemType,
  keyExtractor,
  overscan = 5,
  style,
  contentContainerStyle,
}: UseVirtualListProps<T>) {
  const { width } = useWindowDimensions();

  const getItem = useCallback(
    (items: T[], index: number) => items[index],
    []
  );

  const getItemCount = useCallback(
    (items: T[]) => items.length,
    []
  );

  const renderVirtualItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <View style={{ minHeight: estimatedItemSize }}>
        {renderItem(item, index)}
      </View>
    ),
    [renderItem, estimatedItemSize]
  );

  const VirtualList = useCallback(
    () => (
      <VirtualizedList
        data={data}
        getItem={getItem}
        getItemCount={getItemCount}
        renderItem={renderVirtualItem}
        getItemType={getItemType}
        keyExtractor={keyExtractor}
        windowSize={overscan}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        style={style}
        contentContainerStyle={contentContainerStyle}
      />
    ),
    [data, width, style, contentContainerStyle]
  );

  return { VirtualList };
}
