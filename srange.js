// encoding "US-ASCII";

if ('undefined' === typeof $imple) {
  eval('var\x20$imple={};');
}

(function () {
  
  function findFollowingPoint (refNode, offset, count) {
    var node = refNode;
    var end;
    var max;
    var tmp = null;
    
    switch (node.nodeType) {
      
    case Node.TEXT_NODE :
    case Node.CDATA_SECTION_NODE :
    case Node.PROCESSING_INSTRUCTION_NODE :
    case Node.COMMENT_NODE :
      end = offset + count;
      max = node.data.length;
      
      if (end < max) {  // "<" minimum, "<=" maximum
        return [ node, end ];
      }
      
      count = end - max;
      break;
      
    default :
      tmp = node.childNodes[offset];
    }
    
    if (tmp) {
      for (node = tmp; tmp = node.firstChild; ) {
        node = tmp;
      }
    }
    else {
      do {
        if ((tmp = node.nextSibling)) {
          node = tmp;
          break;
        }
      }
      while ((node = node.parentNode));
    }
    
    WALK: while (node) {
      switch (node.nodeType) {
        
      case Node.TEXT_NODE :
      case Node.CDATA_SECTION_NODE :
        end = count;
        max = node.length;
        
        if (end < max) {  // "<" minimum, "<=" maximum
          return [ node, end ];
        }
        
        count -= max;
        
      case Node.PROCESSING_INSTRUCTION_NODE :
      case Node.COMMENT_NODE :
        break;
        
      default :
        if (node.hasChildNodes ()) {
          while ((tmp = node.firstChild)) {
            node = tmp;
          }
          continue WALK;
        }
      }
      
      do {
        if ((tmp = node.nextSibling)) {
          node = tmp;
          continue WALK;
        }
      }
      while ((node = node.parentNode));
    }
    
    throw new Error('DOMException.DOMSTRING_SIZE_ERR(2)');
  }
  
  function findPrecedingPoint (refNode, offset, count) {
    var node = refNode;
    var end;
    var max;
    var tmp = null;
    
    switch (node.nodeType) {
      
    case Node.TEXT_NODE :
    case Node.CDATA_SECTION_NODE :
    case Node.PROCESSING_INSTRUCTION_NODE :
    case Node.COMMENT_NODE :
      max = offset;
      end = max - count;
      
      if (0 < end) {
        return [ node, end ];
      }
      
      count -= max;
      break;
      
    default :
      tmp = node.childNodes[offset - 1];
    }
    
    if (tmp) {
      node = tmp;
    }
    else {
      do {
        if ((tmp = node.previousSibling)) {
          node = tmp;
          break;
        }
      }
      while ((node = node.parentNode));
    }
    
    while ((tmp = node.lastChild)) {
      node = tmp;
    }
    
    WALK: while (node) {
      switch (node.nodeType) {
        
      case Node.TEXT_NODE :
      case Node.CDATA_SECTION_NODE :
        max = node.length;
        end = max - count;
        
        if (0 < end) {  // "<" minimum, "<=" maximum
          return [ node, end ];
        }
        
        count -= max;
        
      case Node.PROCESSING_INSTRUCTION_NODE :
      case Node.COMMENT_NODE :
        break;
        
      default :
        if (node.hasChildNodes ()) {
          while ((tmp = node.lastChild)) {
            node = tmp;
          }
          continue WALK;
        }
      }
      
      do {
        if ((tmp = node.previousSibling)) {
          node = tmp;
          continue WALK;
        }
      }
      while ((node = node.parentNode));
    }
    
    throw new Error('DOMException.DOMSTRING_SIZE_ERR(2)');
  }
  
  //
  function moveStartPoint (range, count) {
    if (count < 0) {
      count = -count;
    }
    
    var point = findFollowingPoint(range.startContainer, range.startOffset, +count);
    range.setStart(point[0], point[1]);
    return range;
  }
  
  function moveEndPoint (range, count) {
    if (count < 0) {
      count = -count;
    }
    
    var point = findPrecedingPoint(range.endContainer, range.endOffset, +count);
    range.setEnd(point[0], point[1]);
    return range;
  }
  
  //
  function findStringRanges (sourceRange, searchString, offset, count) {
    var ranges = [ ];
    var sourceString = sourceRange.toString();
    var index = sourceString.indexOf(searchString);
    
    if (index < 0) {
      return ranges;
    }
    
    var sourceLength = sourceString.length;
    var range;
    
    do {
      range = sourceRange.cloneRange();
      moveStartPoint(range, index + offset);
      moveEndPoint(range, index + offset + count - sourceLength);
      ranges[ranges.length] = range;
      index = sourceString.indexOf(searchString, index + 1);
    }
    while (index >= 0);
    
    return ranges;
  }
  
  function getStringRange (range, searchString, offset, count) {
    var defaultOffset = 1;
    
    if (range.nodeType > 0) {  // node
      var n = range;
      range = n.ownerDocument.createRange();
      range.selectNode(n);
    }
    
    switch (arguments.length) {
      
    case 2 :
      offset = defaultOffset;
      
    case 3 :
      count = searchString.length - offset + defaultOffset;
      
    case 4 :
      break;
      
    default :
      throw new Error('DOMException.INVALID_ACCESS_ERR(15)');
    }
    
    return findStringRanges(range, searchString, offset - defaultOffset, count);
  }
  
  //
  function findPatternRanges (sourceRange, pattern) {
    var ranges = [ ];
    var sourceString = sourceRange.toString();
    var matched = pattern.exec(sourceString);
    
    if (! matched) {
      return ranges;
    }
    
    var sourceLength = sourceString.length;
    
    do {
      var contextString = matched[0];
      var offset = -1;
      var count;
      var index = matched.index;
      var matchedCount = matched.length;
      var loop = Number(matchedCount !== 1);
      
      for (; loop < matchedCount; loop++, offset++) {
        var range = sourceRange.cloneRange();
        var str = matched[loop];
        
        if (str) {
          offset = contextString.indexOf(str, offset);
          count = str.length;
          moveStartPoint(range, index + offset);
          moveEndPoint(range, index + offset + count - sourceLength);
          ranges[ranges.length] = range;
        }
      }
    }
    while ((matched = pattern.exec(sourceString)));
    
    return ranges;
  }
  
  function getPatternRange (range, searchValue) {
    var flags = 'g';
    
    if (range.nodeType > 0) {  // node
      var n = range;
      range = n.ownerDocument.createRange();
      range.selectNode(n);
    }
    
    if (searchValue instanceof RegExp) {
      if (searchValue.ignoreCase) {
        flags += 'i';
      }
      if (searchValue.multiline) {
        flags += 'm';
      }
      searchValue = searchValue.source;
    }
    else {
      searchValue = String(searchValue).replace (/\W/g, '\\$&');
    }
    
    return findPatternRanges(range, new RegExp(searchValue, flags));
  }
  
  //
  this.getStringRange = getStringRange;
  this.getPatternRange = getPatternRange;
  
}).call ($imple);
