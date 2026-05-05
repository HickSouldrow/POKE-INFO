import React from 'react';
import { FlatList, View, ActivityIndicator } from 'react-native';
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
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id)}
      
      
      contentContainerStyle={{
        paddingBottom: 40, 
        gap: 16, 
      }}
      

      removeClippedSubviews={true}
      
      renderItem={({ item }) => (
        <Card>
          {renderItemContent(item)}
        </Card>
      )}

      // Feedback de carregamento com a cor do Theme
      ListFooterComponent={() => (
        isLoading ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator color={Theme.colors.primaryRed} />
          </View>
        ) : null
      )}

      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3} 
      
      // Performance: impede que o fundo branco apareça em scrolls rápidos
      style={{ backgroundColor: Theme.colors.background }}
      showsVerticalScrollIndicator={false}
    />
  );
}