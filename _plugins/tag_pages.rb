# Generates a page and an RSS feed for each tag found in posts.
#
# Posts in this site use `tag:` (singular) in front matter, e.g.:
#   tag:
#     - java
#     - docker
#
# For each unique tag this generator creates:
#   /tag/<slug>/           -> uses _layouts/tag.html
#   /tag/<slug>/feed.xml   -> uses _layouts/tag_feed.xml
#
# It also exposes `site.tag_list` (sorted array of [tag, posts]) so the
# main tags.html page can list them without recomputing.

module Jekyll
  class TagPage < Page
    def initialize(site, base, tag, posts)
      @site = site
      @base = base
      slug = Jekyll::Utils.slugify(tag.to_s)
      @dir  = File.join('tag', slug)
      @name = 'index.html'

      process(@name)
      read_yaml(File.join(base, '_layouts'), 'tag.html')
      data['tag']   = tag
      data['slug']  = slug
      data['posts'] = posts
      data['title'] = "Posts tagged \"#{tag}\""
      data['description'] = "All posts tagged \"#{tag}\" on #{site.config['title']}."
    end
  end

  class TagFeed < Page
    def initialize(site, base, tag, posts)
      @site = site
      @base = base
      slug = Jekyll::Utils.slugify(tag.to_s)
      @dir  = File.join('tag', slug)
      @name = 'feed.xml'

      process(@name)
      read_yaml(File.join(base, '_layouts'), 'tag_feed.xml')
      data['tag']   = tag
      data['slug']  = slug
      data['posts'] = posts
      data['title'] = "#{site.config['title']} – tag: #{tag}"
    end
  end

  class TagPagesGenerator < Generator
    safe true
    priority :low

    def generate(site)
      tag_map = {}

      site.posts.docs.each do |post|
        next if post.data['hidden']
        tags = Array(post.data['tag'] || post.data['tags'])
        tags.each do |t|
          next if t.nil?
          name = t.to_s.strip
          next if name.empty?
          (tag_map[name] ||= []) << post
        end
      end

      tag_map.each do |tag, posts|
        sorted = posts.sort_by { |p| p.date }.reverse
        site.pages << TagPage.new(site, site.source, tag, sorted)
        site.pages << TagFeed.new(site, site.source, tag, sorted)
      end

      # Expose to Liquid templates.
      site.config['tag_list'] = tag_map
        .map { |t, ps| [t, ps.sort_by { |p| p.date }.reverse] }
        .sort_by { |t, _| t.downcase }
    end
  end
end

