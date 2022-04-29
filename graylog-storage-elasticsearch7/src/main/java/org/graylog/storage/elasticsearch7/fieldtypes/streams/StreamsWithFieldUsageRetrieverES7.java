/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
package org.graylog.storage.elasticsearch7.fieldtypes.streams;

import org.graylog.shaded.elasticsearch7.org.elasticsearch.action.search.SearchRequest;
import org.graylog.shaded.elasticsearch7.org.elasticsearch.action.search.SearchResponse;
import org.graylog.shaded.elasticsearch7.org.elasticsearch.index.query.BoolQueryBuilder;
import org.graylog.shaded.elasticsearch7.org.elasticsearch.index.query.ExistsQueryBuilder;
import org.graylog.shaded.elasticsearch7.org.elasticsearch.search.aggregations.Aggregation;
import org.graylog.shaded.elasticsearch7.org.elasticsearch.search.aggregations.AggregationBuilders;
import org.graylog.shaded.elasticsearch7.org.elasticsearch.search.aggregations.Aggregations;
import org.graylog.shaded.elasticsearch7.org.elasticsearch.search.aggregations.bucket.MultiBucketsAggregation;
import org.graylog.shaded.elasticsearch7.org.elasticsearch.search.builder.SearchSourceBuilder;
import org.graylog.storage.elasticsearch7.ElasticsearchClient;
import org.graylog2.indexer.fieldtypes.streamfiltered.esadapters.StreamsWithFieldUsageRetriever;
import org.graylog2.plugin.Message;

import javax.inject.Inject;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class StreamsWithFieldUsageRetrieverES7 implements StreamsWithFieldUsageRetriever {

    private final ElasticsearchClient client;

    @Inject
    public StreamsWithFieldUsageRetrieverES7(final ElasticsearchClient client) {
        this.client = client;
    }

    @Override
    public Set<String> getStreams(final String fieldName, final String indexName) {
        final SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder()
                .query(new BoolQueryBuilder()
                        .filter(new ExistsQueryBuilder(fieldName))
                )
                .size(0);

        searchSourceBuilder.aggregation(AggregationBuilders
                .terms(Message.FIELD_STREAMS)
                .field(Message.FIELD_STREAMS)
                .size(10_000));//MAX_BUCKETS...

        final SearchRequest searchRequest = new SearchRequest(indexName)
                .source(searchSourceBuilder);

        final SearchResponse searchResult = client.search(searchRequest, "Unable to retrieve fields types aggregations");

        final Aggregations aggregations = searchResult.getAggregations();
        if (aggregations != null) {
            final Aggregation streamsAggregation = aggregations.get(Message.FIELD_STREAMS);

            if (streamsAggregation instanceof MultiBucketsAggregation) {
                final List<? extends MultiBucketsAggregation.Bucket> buckets = ((MultiBucketsAggregation) streamsAggregation).getBuckets();
                if (buckets != null) {
                    return buckets.stream()
                            .map(MultiBucketsAggregation.Bucket::getKeyAsString)
                            .collect(Collectors.toSet());
                }
            }
        }
        return Set.of();
    }

}
