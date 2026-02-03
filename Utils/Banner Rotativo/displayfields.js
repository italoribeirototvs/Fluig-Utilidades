function displayFields(form,customHTML){ 
	
	  form.setShowDisabledFields(true);
	  form.setHidePrintLink(true);
	  customHTML.append("<script>function getWKNumState(){ return " + getValue("WKNumState") + "; }</script>");
	  customHTML.append("<script>function getNumProces(){ return " + getValue("WKNumProces") + "; }</script>");
	  customHTML.append("<script>function getWKNextState(){ return " + getValue("WKNextState") + "; }</script>");
	  customHTML.append("<script>function getWKMobile(){ return " + getValue("WKMobile") + "; }</script>");
	  
	 
}
