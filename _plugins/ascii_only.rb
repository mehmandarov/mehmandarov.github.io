# Liquid filter: ascii_only
#
# Converts every codepoint > U+007F into a decimal HTML/XML numeric character
# reference (&#NNNN;). The result is a pure 7-bit ASCII string.
#
# Why we need this:
#   GitHub Pages serves *.xml with `Content-Type: application/xml` and no
#   `charset=` parameter. Some feed aggregators (notably the Planet/Pluto
#   family that powers jakartablogs.ee) ignore the in-document XML
#   declaration and fall back to Windows-1252 decoding, which mangles every
#   multi-byte UTF-8 sequence into mojibake (e.g. "What's" → "What€™s").
#
#   By emitting only ASCII bytes, encoding detection becomes irrelevant: the
#   bytes are identical under UTF-8, ISO-8859-1, Windows-1252, US-ASCII, etc.
#   The Atom <content type="html"> reader then HTML-decodes the NCRs back
#   into the correct Unicode characters at render time.
#
# This filter is safe inside CDATA: clients treat type="html" payload as HTML
# and parse entities even when the XML wrapper used CDATA.
module Jekyll
  module AsciiOnlyFilter
    def ascii_only(input)
      return input if input.nil?
      str = input.to_s
      # Ensure we iterate over Unicode codepoints, not raw bytes.
      str = str.dup.force_encoding('UTF-8') unless str.encoding == Encoding::UTF_8
      str.each_char.map { |c|
        cp = c.ord
        cp < 0x80 ? c : "&##{cp};"
      }.join
    end
  end
end

Liquid::Template.register_filter(Jekyll::AsciiOnlyFilter)

