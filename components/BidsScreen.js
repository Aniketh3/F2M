import React from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';

const data = [
  {
    id: '1',
    item: 'Apples',
    eligibleQty: 6,
    totalAmount: 2114.65,
    profitLoss: 3417.25,
  },
  {
    id: '2',
    item: 'Oranges',
    eligibleQty: 15,
    totalAmount: 570.10,
    profitLoss: -58.50,
  },
  {
    id: '3',
    item: 'Bananas',
    eligibleQty: 3,
    totalAmount: 2109.76,
    profitLoss: 1677.10,
  },
  {
    id: '4',
    item: 'Grapes',
    eligibleQty: 32,
    totalAmount: 185.57,
    profitLoss: -252.00,
  },
];

const BidsScreen = () => {
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.item.toUpperCase()}</Text>
        <Text style={styles.itemQty}>Eligible qty {item.eligibleQty} kgs</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemTotal}>Total amount {item.totalAmount.toFixed(2)}</Text>
        <Text style={[styles.itemPL, item.profitLoss >= 0 ? styles.profit : styles.loss]}>
          {item.profitLoss >= 0 ? '+' : ''}{item.profitLoss.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        // ListHeaderComponent={() => (
        //   <View style={styles.header}>
        //     <Text style={styles.headerText}>Bids</Text>
        //   </View>
        // )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#000',
  },
  headerText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  itemQty: {
    fontSize: 16,
    color: '#000',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  itemTotal: {
    fontSize: 16,
    color: '#000',
  },
  itemPL: {
    fontSize: 16,
  },
  profit: {
    color: 'green',
  },
  loss: {
    color: 'red',
  },
});

export default BidsScreen;