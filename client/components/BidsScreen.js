import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';

const BiddingScreen = () => {
  const [sellerPrice, setSellerPrice] = useState('');
  const [buyerBid, setBuyerBid] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [bids, setBids] = useState([]);
  const [winningBid, setWinningBid] = useState(null);
  const [winnerDeclared, setWinnerDeclared] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds time limit
  const intervalRef = useRef(null);

  useEffect(() => {
    if (bids.length > 0) {
      determineWinningBid(bids);
    }
  }, [bids]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(intervalRef.current);
          if (!winnerDeclared) {
            determineFinalWinner();
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const handleBidSubmit = () => {
    if (timeLeft > 0 && buyerName && buyerBid) {
      const newBid = { id: bids.length + 1, name: buyerName, bid: parseFloat(buyerBid) };
      const updatedBids = [...bids, newBid];
      setBids(updatedBids);
      setBuyerName('');
      setBuyerBid('');
    } else {
      Alert.alert('Time Up', 'Bid submission is closed as time is up.');
    }
  };

  const determineWinningBid = (bids) => {
    if (bids.length > 0) {
      const highestBid = bids.reduce((max, bid) => (bid.bid > max.bid ? bid : max), bids[0]);
      setWinningBid(highestBid);
      if (highestBid.bid >= parseFloat(sellerPrice) * 1.15 && !winnerDeclared) {
        setWinnerDeclared(true);
        Alert.alert('Winner Declared', `${highestBid.name} wins the bid with $${highestBid.bid.toFixed(2)}`);
      }
    }
  };

  const determineFinalWinner = () => {
    if (bids.length > 0) {
      const highestBid = bids.reduce((max, bid) => (bid.bid > max.bid ? bid : max), bids[0]);
      setWinningBid(highestBid);
      setWinnerDeclared(true);
      Alert.alert('Time Up', `${highestBid.name} wins the bid with $${highestBid.bid.toFixed(2)}`);
    } else {
      Alert.alert('Time Up', 'No bids were placed.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bidding Screen</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Seller's Price"
        value={sellerPrice}
        onChangeText={setSellerPrice}
        keyboardType="numeric"
        placeholderTextColor="#F0F0F0"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Your Name"
        value={buyerName}
        onChangeText={setBuyerName}
        editable={timeLeft > 0}
        placeholderTextColor="#F0F0F0"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Your Bid"
        value={buyerBid}
        onChangeText={setBuyerBid}
        keyboardType="numeric"
        editable={timeLeft > 0}
        placeholderTextColor="#F0F0F0"
      />
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: timeLeft <= 0 ? '#B0B0B0' : '#FF5722' }]} 
        onPress={handleBidSubmit}
        disabled={timeLeft <= 0}
      >
        <Text style={styles.buttonText}>Submit Bid</Text>
      </TouchableOpacity>
      <FlatList
        data={bids}
        renderItem={({ item }) => (
          <Text style={styles.bidItem}>
            {item.name}: ${item.bid.toFixed(2)}
          </Text>
        )}
        keyExtractor={item => item.id.toString()}
        style={styles.bidsList}
      />
      {winningBid && (
        <Text style={styles.winningBid}>
          Current Winning Bid: {winningBid.name} with ${winningBid.bid.toFixed(2)}
        </Text>
      )}
      <Text style={styles.timer}>Time Left: {formatTime(timeLeft)}</Text>
    </View>
  );
};

export default BiddingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  input: {
    width: '90%',
    height: 50,
    borderColor: '#1B5E20',
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    color: '#333',
  },
  button: {
    width: '90%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bidItem: {
    color: '#1B5E20',
    fontSize: 16,
    padding: 10,
    backgroundColor: '#C8E6C9',
    borderRadius: 5,
    marginBottom: 5,
    width: '90%',
    textAlign: 'center',
  },
  bidsList: {
    width: '100%',
    marginVertical: 20,
  },
  winningBid: {
    marginTop: 20,
    color: '#FFEB3B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timer: {
    marginTop: 20,
    color: '#D32F2F',
    fontSize: 18,
  },
});
