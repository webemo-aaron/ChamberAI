import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text
} from "react-native";
import { useMeetings } from "../hooks/useMeetings";
import MeetingCard from "../components/MeetingCard";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 20
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center"
  },
  footerLoader: {
    opacity: 0.5
  }
});

export default function MeetingListScreen({ navigation }: any) {
  const { meetings, loading, refreshing, hasMore, loadMore, refresh } =
    useMeetings();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleEndReached = async () => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      await loadMore();
      setIsLoadingMore(false);
    }
  };

  const renderMeeting = ({ item }: any) => (
    <MeetingCard
      meeting={item}
      onPress={() => navigation.navigate("MeetingDetail", { id: item.id })}
    />
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color="#1f2937" style={styles.footerLoader} />
      </View>
    );
  };

  if (loading && meetings.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1f2937" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={meetings}
        renderItem={renderMeeting}
        keyExtractor={(item) => item.id}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        contentContainerStyle={
          meetings.length === 0 ? styles.loaderContainer : styles.contentContainer
        }
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>No meetings yet</Text>
          )
        }
      />
    </View>
  );
}
