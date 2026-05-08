import React from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { Theme } from "../../styles/theme";
import { Card } from '../../components/card';

interface ListProps {
  data: any[];
  onLoadMore: () => void;
  renderItemContent: (item: any) => React.ReactNode;
  isLoading?: boolean;
}

export function List({ 
  data, 
  onLoadMore, 
  renderItemContent,
  isLoading 
}: ListProps) {
  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: 40,
        gap: 16,
      }}
      style={{ backgroundColor: Theme.colors.background }}
      showsVerticalScrollIndicator={false}
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
        if (isNearBottom) onLoadMore();
      }}
      scrollEventThrottle={400}
    >
      {data.map((item) => (
        <Card key={String(item.id)}>
          {renderItemContent(item)}
        </Card>
      ))}

      {isLoading && (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator color={Theme.colors.primaryRed} />
        </View>
      )}
    </ScrollView>
  );
}
