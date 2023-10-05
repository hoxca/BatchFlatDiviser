function BatchFlatDiviserDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //

   var labelWidth1 = this.font.width( "Output format hints:" + 'T' );
   this.textEditWidth = 25 * this.font.width( "M" );
   this.numericEditWidth = 6 * this.font.width( "0" );
   //

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = this.logicalPixelsToPhysical( 4 );
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; " +
                         "A batch to apply synthetic flat division to lights frames.</p>" +
                         "<p>Copyright &copy; 2023 Hugues Obolonsky - HoxCa</p>";
   //

   this.files_TreeBox = new TreeBox( this );
   this.files_TreeBox.multipleSelection = true;
   this.files_TreeBox.rootDecoration = false;
   this.files_TreeBox.alternateRowColor = true;
   this.files_TreeBox.setScaledMinSize( 300, 200 );
   this.files_TreeBox.numberOfColumns = 1;
   this.files_TreeBox.headerVisible = false;

   for ( var i = 0; i < flatDiviser.inputFiles.length; ++i )
   {
      var node = new TreeBoxNode( this.files_TreeBox );
      node.setText( 0, flatDiviser.inputFiles[i]);
   }

   this.filesAdd_Button = new PushButton( this );
   this.filesAdd_Button.text = "Add";
   this.filesAdd_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.filesAdd_Button.toolTip = "<p>Add image files to the input images list.</p>";
   this.filesAdd_Button.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "Select Images";
      ofd.loadImageFilters();

      if ( ofd.execute() )
      {
         this.dialog.files_TreeBox.canUpdate = false;
         for ( var i = 0; i < ofd.fileNames.length; ++i )
         {
            var node = new TreeBoxNode( this.dialog.files_TreeBox );
            node.setText( 0, ofd.fileNames[i].split(/[\\/]/).pop() );
            node.setToolTip( 0, ofd.fileNames[i] );
            flatDiviser.inputFiles.push( ofd.fileNames[i] );
         }
         this.dialog.files_TreeBox.canUpdate = true;
      }
   };

   this.filesClear_Button = new PushButton( this );
   this.filesClear_Button.text = "Clear";
   this.filesClear_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.filesClear_Button.toolTip = "<p>Clear the list of input images.</p>";
   this.filesClear_Button.onClick = function()
   {
      this.dialog.files_TreeBox.clear();
      flatDiviser.inputFiles.length = 0;
   };

   this.filesInvert_Button = new PushButton( this );
   this.filesInvert_Button.text = "Invert Selection";
   this.filesInvert_Button.icon = this.scaledResource( ":/icons/select-invert.png" );
   this.filesInvert_Button.toolTip = "<p>Invert the current selection of input images.</p>";
   this.filesInvert_Button.onClick = function()
   {
      for ( var i = 0; i < this.dialog.files_TreeBox.numberOfChildren; ++i )
         this.dialog.files_TreeBox.child( i ).selected =
               !this.dialog.files_TreeBox.child( i ).selected;
   };

   this.filesRemove_Button = new PushButton( this );
   this.filesRemove_Button.text = "Remove Selected";
   this.filesRemove_Button.icon = this.scaledResource( ":/icons/delete.png" );
   this.filesRemove_Button.toolTip = "<p>Remove all selected images from the input images list.</p>";
   this.filesRemove_Button.onClick = function()
   {
      flatDiviser.inputFiles.length = 0;
      for ( var i = 0; i < this.dialog.files_TreeBox.numberOfChildren; ++i )
         if ( !this.dialog.files_TreeBox.child( i ).selected )
            flatDiviser.inputFiles.push( this.dialog.files_TreeBox.child( i ).text( 0 ) );
      for ( var i = this.dialog.files_TreeBox.numberOfChildren; --i >= 0; )
         if ( this.dialog.files_TreeBox.child( i ).selected )
            this.dialog.files_TreeBox.remove( i );
   };

   this.filesButtons_Sizer = new HorizontalSizer;
   this.filesButtons_Sizer.spacing = 4;
   this.filesButtons_Sizer.add( this.filesAdd_Button );
   this.filesButtons_Sizer.addStretch();
   this.filesButtons_Sizer.add( this.filesClear_Button );
   this.filesButtons_Sizer.addStretch();
   this.filesButtons_Sizer.add( this.filesInvert_Button );
   this.filesButtons_Sizer.add( this.filesRemove_Button );

   this.files_GroupBox = new GroupBox( this );
   this.files_GroupBox.title = "Input Images";
   this.files_GroupBox.sizer = new VerticalSizer;
   this.files_GroupBox.sizer.margin = 6;
   this.files_GroupBox.sizer.spacing = 4;
   this.files_GroupBox.sizer.add( this.files_TreeBox, this.textEditWidth );
   this.files_GroupBox.sizer.add( this.filesButtons_Sizer );

   // Reference for Flat Image division and mask
   // Reference image
   this.syntheticFlatImageLabel = new Label( this );
   with (this.syntheticFlatImageLabel) {
      text = "Synthetic Flat Image:";
      minWidth = labelWidth1;
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
      }

   this.syntheticFlatImageEdit = new Edit( this );
   this.syntheticFlatImageEdit.minWidth = this.textEditWidth;
   this.syntheticFlatImageEdit.text = flatDiviser.syntheticFlatImageName;
   this.syntheticFlatImageEdit.toolTip = "<p>Residual bulk image artefacts to nuke.</p>";
   this.syntheticFlatImageEdit.onEditCompleted = function()
   {
      flatDiviser.syntheticFlatImageName = this.text = File.windowsPathToUnix( this.text.trim() );
   };

   this.syntheticFlatImageSelectButton = new ToolButton( this );
   this.syntheticFlatImageSelectButton.icon = this.scaledResource( ":/icons/select-file.png" );
   this.syntheticFlatImageSelectButton.setScaledFixedSize( 20, 20 );
   this.syntheticFlatImageSelectButton.toolTip = "<p>Select the residual bulk image file.</p>";
   this.syntheticFlatImageSelectButton.onClick = function()
   {
      var rbifd = new OpenFileDialog;
      rbifd.multipleSelections = false;
      rbifd.caption = "Select Select the residual bulk image file";
      rbifd.loadImageFilters();
      if ( rbifd.execute() )
      {
         this.dialog.syntheticFlatImageEdit.text = flatDiviser.syntheticFlatImageName = rbifd.fileName;
      }
   };

   this.syntheticFlatImageSizer = new HorizontalSizer;
   this.syntheticFlatImageSizer.add( this.syntheticFlatImageLabel );
   this.syntheticFlatImageSizer.addSpacing( 4 );
   this.syntheticFlatImageSizer.add( this.syntheticFlatImageEdit, this.textEditWidth );
   this.syntheticFlatImageSizer.addSpacing( 2 );
   this.syntheticFlatImageSizer.add( this.syntheticFlatImageSelectButton );

   this.flatMaskImageLabel = new Label( this );
   with (this.flatMaskImageLabel) {
      text = "Synthetic Flat Mask:";
      minWidth = labelWidth1;
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
      }

   this.flatMaskImageEdit = new Edit( this );
   this.flatMaskImageEdit.minWidth = this.textEditWidth;
   this.flatMaskImageEdit.text = flatDiviser.flatMaskImageName;
   this.flatMaskImageEdit.toolTip = "<p>Synthetic Flat Mask.</p>";
   this.flatMaskImageEdit.onEditCompleted = function()
   {
      flatDiviser.flatMaskImage = this.text = File.windowsPathToUnix( this.text.trim() );
   };

   this.flatMaskImageSelectButton = new ToolButton( this );
   this.flatMaskImageSelectButton.icon = this.scaledResource( ":/icons/select-file.png" );
   this.flatMaskImageSelectButton.setScaledFixedSize( 20, 20 );
   this.flatMaskImageSelectButton.toolTip = "<p>Select mask for flat division.</p>";
   this.flatMaskImageSelectButton.onClick = function()
   {
      var rbimfd = new OpenFileDialog;
      rbimfd.multipleSelections = false;
      rbimfd.caption = "Select mask for flat image division";
      rbimfd.loadImageFilters();
      if ( rbimfd.execute() )
      {
         this.dialog.flatMaskImageEdit.text = flatDiviser.flatMaskImage = rbimfd.fileName;
      }
   };

   this.flatMaskImageSizer = new HorizontalSizer;
   this.flatMaskImageSizer.add( this.flatMaskImageLabel );
   this.flatMaskImageSizer.addSpacing( 4 );
   this.flatMaskImageSizer.add( this.flatMaskImageEdit, this.textEditWidth );
   this.flatMaskImageSizer.addSpacing( 2 );
   this.flatMaskImageSizer.add( this.flatMaskImageSelectButton );

   this.rbi_GroupBox = new GroupBox( this );
   with ( this.rbi_GroupBox ) {
      title = "Synthetic Flat Image";
      sizer =  new VerticalSizer ;
      sizer.margin = 6;
      sizer.spacing = 4;
      sizer.add ( this.syntheticFlatImageSizer );
      sizer.add ( this.flatMaskImageSizer );
   }

   // Output

   this.outputDir_Edit = new Edit( this );
   this.outputDir_Edit.readOnly = false;
   this.outputDir_Edit.text = flatDiviser.outputDirectory;
   this.outputDir_Edit.toolTip =
      "<p>If specified, all converted images will be written to the output directory.</p>" +
      "<p>If not specified, converted images will be written to the same directories " +
      "of their corresponding input images.</p>";

   this.outputDirSelect_Button = new ToolButton( this );
   this.outputDirSelect_Button.icon = this.scaledResource( ":/browser/select-file.png" );
   this.outputDirSelect_Button.setScaledFixedSize( 20, 20 );
   this.outputDirSelect_Button.toolTip = "<p>Select the output directory.</p>";
   this.outputDirSelect_Button.onClick = function()
   {
      var gdd = new GetDirectoryDialog;
      gdd.initialPath = flatDiviser.outputDirectory;
      gdd.caption = "Select Output Directory";

      if ( gdd.execute() )
      {
         flatDiviser.outputDirectory = gdd.directory;
         this.dialog.outputDir_Edit.text = flatDiviser.outputDirectory;
      }
   };

   this.outputDir_Label = new Label( this );
   this.outputDir_Label.text = "Output Directory:";
   this.outputDir_Label.minWidth = labelWidth1;
   this.outputDir_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.outputDir_Sizer = new HorizontalSizer;
   this.outputDir_Sizer.spacing = 4;
   this.outputDir_Sizer.add( this.outputDir_Label );
   this.outputDir_Sizer.add( this.outputDir_Edit, this.textEditWidth );
   this.outputDir_Sizer.add( this.outputDirSelect_Button );

   this.outputPrefix_Label = new Label (this);
   this.outputPrefix_Label.text = "Prefix:";
   this.outputPrefix_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.outputPrefix_Edit = new Edit( this );
   this.outputPrefix_Edit.text = flatDiviser.outputPrefix;
   this.outputPrefix_Edit.setFixedWidth( this.font.width( "MMMMMM" ) );
   this.outputPrefix_Edit.toolTip = "";
   this.outputPrefix_Edit.onEditCompleted = function()
   {
      flatDiviser.outputPrefix = this.text;
   };

   this.outputPostfix_Label = new Label (this);
   this.outputPostfix_Label.text = "Postfix:";
   this.outputPostfix_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.outputPostfix_Edit = new Edit( this );
   this.outputPostfix_Edit.text = flatDiviser.outputPostfix;
   this.outputPostfix_Edit.setFixedWidth( this.font.width( "MMMMMM" ) );
   this.outputPostfix_Edit.toolTip = "";
   this.outputPostfix_Edit.onEditCompleted = function()
   {
      flatDiviser.outputPostfix = this.text;
   };

   var outExtToolTip = "<p>Specify a file extension to identify the output file format.</p>" +
      "<p>Be sure the selected output format is able to write images, or the batch linear fit " +
      "process will fail upon attempting to write the first output image.</p>";

   this.outputExt_Label = new Label( this );
   this.outputExt_Label.text = "Output extension:";
   this.outputExt_Label.minWidth = labelWidth1;
   this.outputExt_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.outputExt_Label.toolTip = outExtToolTip;

   this.outputExt_Edit = new Edit( this );
   this.outputExt_Edit.text = flatDiviser.outputExtension;
   this.outputExt_Edit.setFixedWidth( this.font.width( "MMMMMM" ) );
   this.outputExt_Edit.toolTip = outExtToolTip;
   this.outputExt_Edit.onEditCompleted = function()
   {
      // Image extensions are always lowercase in PI/PCL.
      var ext = this.text.trim().toLowerCase();

      // Use the default extension if empty.
      // Ensure that ext begins with a dot character.
      if ( ext.length == 0 || ext == '.' )
         ext = DEFAULT_OUTPUT_EXTENSION;
      else if ( !ext.startsWith( '.' ) )
         ext = '.' + ext;

      this.text = flatDiviser.outputExtension = ext;
   };

   this.options_Sizer = new HorizontalSizer;
   this.options_Sizer.spacing = 4;
   this.options_Sizer.add( this.outputExt_Label );
   this.options_Sizer.add( this.outputExt_Edit );
   this.options_Sizer.addSpacing( 8 );
   this.options_Sizer.add( this.outputPrefix_Label );
   this.options_Sizer.add( this.outputPrefix_Edit );
   this.options_Sizer.addSpacing( 8 );
   this.options_Sizer.add( this.outputPostfix_Label );
   this.options_Sizer.add( this.outputPostfix_Edit );
   this.options_Sizer.addStretch();

   //

   this.overwriteExisting_CheckBox = new CheckBox( this );
   this.overwriteExisting_CheckBox.text = "Overwrite existing files";
   this.overwriteExisting_CheckBox.checked = flatDiviser.overwriteExisting;
   this.overwriteExisting_CheckBox.toolTip =
      "<p>Allow overwriting of existing image files.</p>" +
      "<p><b>* Warning *</b> This option may lead to irreversible data loss - enable it at your own risk.</p>";
   this.overwriteExisting_CheckBox.onClick = function( checked )
   {
      flatDiviser.overwriteExisting = checked;
   };

   this.overwriteExisting_Sizer = new HorizontalSizer;
   this.overwriteExisting_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.overwriteExisting_Sizer.add( this.overwriteExisting_CheckBox );
   this.overwriteExisting_Sizer.addStretch();

   //

   this.outputOptions_GroupBox = new GroupBox( this );
   this.outputOptions_GroupBox.title = "Output File Options";
   this.outputOptions_GroupBox.sizer = new VerticalSizer;
   this.outputOptions_GroupBox.sizer.margin = 6;
   this.outputOptions_GroupBox.sizer.spacing = 4;
   this.outputOptions_GroupBox.sizer.add( this.options_Sizer );
   this.outputOptions_GroupBox.sizer.add( this.overwriteExisting_Sizer );
   this.outputOptions_GroupBox.sizer.add( this.outputDir_Sizer );

   //

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.files_GroupBox, 100 );
   this.sizer.add( this.rbi_GroupBox );
   this.sizer.add( this.outputOptions_GroupBox );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script";
   this.userResizable = true;
   this.adjustToContents();
}
