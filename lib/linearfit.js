function applyLinearFit(referenceImageView,syntheticFlatImageWindowCloneView) {

  var linearFitProcess = new LinearFit;
  with (linearFitProcess){
    referenceViewId = referenceImageView.id;
    rejectLow = 0.000000;
    rejectHigh = 0.920000;
    executeOn(syntheticFlatImageWindowCloneView);
  }

}
