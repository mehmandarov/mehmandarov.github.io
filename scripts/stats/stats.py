#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pytablereader as ptr
import pytablewriter as ptw
import six
import codecs
import collections
from collections import defaultdict

#local import
from codes import flag_codes


def write_to_buffer(writer):
    # set output stream to text, so it can be printed og logged
    writer.stream = six.StringIO()
    writer.write_table()
    print(writer.stream.getvalue())


def write_to_markdown(writer):
    # change the output stream to a file
    with codecs.open("sample.md", "w", "utf-8-sig") as f:
        writer.stream = f
        writer.write_table()


def return_unique(hashmap):
    for key, value in hashmap.items():
        if isinstance(value, list):
            if not (isinstance(value[0], list) or isinstance(value[0], set)):
                hashmap[key] = set(value)
            else: # we need to go deeper
                tmp = []
                for v in value:
                    tmp.append(set(v))
                hashmap[key] = tmp
        elif isinstance(value, dict):
            return_unique(value)
    return hashmap


def build_table_stats_annual(data, count_only=False, unique_only=False):
    tmp = []
    table_name = "Annual Stats"

    if unique_only:
        data = return_unique(data)
        table_name = table_name + " (Unique only)"

    writer = ptw.MarkdownTableWriter()
    writer.table_name = table_name
    writer.header_list = ["year", "countries", "cities", "country_city"]

    ordered_data = collections.OrderedDict(sorted(data.items()))

    for key, value in ordered_data.iteritems():
        if not count_only:
            tmp.append([key, ", ".join(list(value[0])), ", ".join(list(value[1])), ", ".join(list(value[2]))])
        else:
            tmp.append([key, len(list(value[0])), len(list(value[1])), len(list(value[2]))])

    writer.value_matrix = tmp
    write_to_buffer(writer)


def build_table_stats_total(data, count_only=False, unique_only=False):
    tmp = []
    table_name = "Total Stats"

    if unique_only:
        data = return_unique(data)
        table_name = table_name + " (Unique only)"

    writer = ptw.MarkdownTableWriter()
    writer.table_name = table_name
    writer.header_list = ["name", "value"]

    for key, value in data.iteritems():
        if not count_only:
            tmp.append([key, "; ".join(value)])
        else:
            tmp.append([key, len(list(value))])

    writer.value_matrix = tmp
    write_to_buffer(writer)


def get_country_flag_emoji(country_name):
    if country_name in flag_codes.country_codes:
        country_code = flag_codes.country_codes[country_name]
    else:
        country_code = 'unknown'

    if country_code == 'unknown':
        return flag_codes.letter_codes['unknown']

    flag_emoji = u''
    for c in country_code:
        flag_emoji += flag_codes.letter_codes[c]
    return flag_emoji


def get_total_stats(data, show_flags=True, unique_only=True):
    number_of_events = len(data['total_country'])

    if unique_only:
        data = return_unique(data)

    total_country_flags = []
    if show_flags:
        for country in sorted(data['total_country']):
            total_country_flags.append(get_country_flag_emoji(country))

    print("Involved in " + str(number_of_events) + " events in " +str(len(data['total_country'])) + " countries.")
    print("   ".join(total_country_flags))


if __name__ == "__main__":
    latest_year = 2017
    stats_pr_year = defaultdict(list)
    stats_total = defaultdict(list)
    current_year = latest_year

    loader = ptr.TableUrlLoader(
        "http://localhost:4000/talks/",
        "html")

    writer = ptw.TableWriterFactory.create_from_format_name("md")

    for table_data in loader.load():
        country_city_pr_year = []
        country_pr_year = []
        city_pr_year = []

        for record in table_data.record_list:
            country_city_pr_year.append(record[1])
            parsed = record[1].split(",")
            country_pr_year.append(parsed[0])
            city_pr_year.append(parsed[1])

        writer.from_tabledata(table_data)

        stats_pr_year[current_year] = [country_pr_year, city_pr_year, country_city_pr_year]

        stats_total["total_country_city"] += country_city_pr_year
        stats_total["total_country"] += country_pr_year
        stats_total["total_city"] += city_pr_year

        current_year = current_year - 1 # assuming there is data for every year and sorted after year (descending)

    #build_table_stats_annual(stats_pr_year, unique_only=True)
    #build_table_stats_annual(stats_pr_year, count_only=True, unique_only=True)

    #build_table_stats_total(stats_total, unique_only=True)
    #build_table_stats_total(stats_total, count_only=True, unique_only=True)
    get_total_stats(stats_total)
